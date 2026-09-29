import { test } from "node:test";
import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { BUTTON_SOUND_PACK_NAMES, BUTTON_SOUND_PACKS } from "./typing-sound-button-packs";
import {
  LAB_SOUND_PACK_NAMES,
  LAYERED_SOUND_PACKS,
  LAYERED_SOUND_PACK_NAMES,
} from "./typing-sound-layered-packs";
import type { SoundLayer, SoundTake } from "./typing-sound-layered-packs";
import {
  DEFAULT_SOUND_PACK,
  SOUND_PACKS,
  SOUND_PACK_COLLECTIONS,
  SOUND_PACK_DESCRIPTIONS,
  SOUND_PACK_LABELS,
  SOUND_PACK_NAMES,
  getSoundPackVariationCount,
  isLayeredSoundPack,
} from "./typing-sound-packs";
import type { SoundVariant } from "./typing-sound-packs";
import { detuneRatio, jitterRatio, pickTakeIndex, scheduleTake } from "./typing-sound-synth";

const VARIANTS: SoundVariant[] = ["letter", "error", "complete"];

/** Deterministic PRNG (mulberry32) so the randomized checks below can't flake. */
function seeded(seed: number): () => number {
  let a = seed;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// --- The library as a whole ---

test("the library has 39 packs: 10 original tones, 9 premium buttons and 20 sound-lab packs", () => {
  assert.equal(Object.keys(SOUND_PACKS).length, 10);
  assert.equal(BUTTON_SOUND_PACK_NAMES.length, 9);
  assert.equal(LAB_SOUND_PACK_NAMES.length, 20);
  assert.equal(LAYERED_SOUND_PACK_NAMES.length, 29);
  assert.equal(SOUND_PACK_NAMES.length, 39);
  assert.equal(new Set(SOUND_PACK_NAMES).size, 39, "pack names are unique");
});

test("every pack belongs to exactly one collection, and the premium buttons come first", () => {
  const seen = new Map<string, string>();
  for (const collection of SOUND_PACK_COLLECTIONS) {
    assert.ok(collection.label.trim() && collection.description.trim(), collection.id);
    assert.ok(collection.packs.length > 0, `${collection.id} is not empty`);
    for (const pack of collection.packs) {
      assert.equal(
        seen.get(pack),
        undefined,
        `${pack} is in ${seen.get(pack)} and ${collection.id}`,
      );
      seen.set(pack, collection.id);
    }
  }
  assert.deepEqual([...seen.keys()].sort(), [...SOUND_PACK_NAMES].sort());
  assert.equal(SOUND_PACK_COLLECTIONS[0]!.id, "premiumButtons");
  assert.deepEqual(SOUND_PACK_COLLECTIONS[0]!.packs, BUTTON_SOUND_PACK_NAMES);
});

test("the default pack is still a real pack (persisted 'soft' selections keep working)", () => {
  assert.equal(DEFAULT_SOUND_PACK, "soft");
  assert.ok(SOUND_PACK_NAMES.includes(DEFAULT_SOUND_PACK));
});

test("every pack has a distinct label and a short description", () => {
  const labels = new Set<string>();
  for (const pack of SOUND_PACK_NAMES) {
    const label = SOUND_PACK_LABELS[pack];
    const description = SOUND_PACK_DESCRIPTIONS[pack];
    assert.ok(label && label.trim().length > 0, `${pack} has a label`);
    assert.ok(description && description.trim().length > 0, `${pack} has a description`);
    assert.ok(description.length <= 80, `${pack} description stays one short line`);
    assert.ok(!labels.has(label), `${pack} label "${label}" is unique`);
    labels.add(label);
  }
});

test("isLayeredSoundPack splits the two families exactly", () => {
  for (const pack of Object.keys(SOUND_PACKS)) {
    assert.equal(isLayeredSoundPack(pack as never), false, pack);
  }
  for (const pack of LAYERED_SOUND_PACK_NAMES) {
    assert.equal(isLayeredSoundPack(pack), true, pack);
  }
});

test("no two layered packs share a keystroke sound (a renamed copy would fail here)", () => {
  const seen = new Map<string, string>();
  for (const pack of LAYERED_SOUND_PACK_NAMES) {
    for (const take of LAYERED_SOUND_PACKS[pack].letter) {
      const key = JSON.stringify(take);
      const owner = seen.get(key);
      assert.equal(owner, undefined, `${pack} duplicates a take of ${owner}`);
      seen.set(key, pack);
    }
  }
});

// --- Every layered pack is playable and safe to hear thousands of times ---

function layerEnd(layer: SoundLayer): number {
  return (layer.startOffset ?? 0) + layer.duration;
}

function takeEnd(take: SoundTake): number {
  return Math.max(...take.map(layerEnd));
}

test("every layered pack defines every variant with at least one take", () => {
  for (const pack of LAYERED_SOUND_PACK_NAMES) {
    for (const variant of VARIANTS) {
      const takes = LAYERED_SOUND_PACKS[pack][variant];
      assert.ok(takes.length >= 1, `${pack}.${variant} has a take`);
      for (const take of takes) assert.ok(take.length >= 1, `${pack}.${variant} take has layers`);
    }
  }
});

test("every layer has valid, in-range numbers (nothing that would throw or blow out the speakers)", () => {
  for (const pack of LAYERED_SOUND_PACK_NAMES) {
    for (const variant of VARIANTS) {
      for (const take of LAYERED_SOUND_PACKS[pack][variant]) {
        for (const layer of take) {
          const where = `${pack}.${variant}`;
          const attack = layer.attack ?? 0.004;
          assert.ok(layer.duration > attack, `${where}: duration must exceed attack`);
          assert.ok(layer.duration <= 0.5, `${where}: layer too long`);
          assert.ok(attack > 0 && attack <= 0.03, `${where}: attack out of range`);
          assert.ok((layer.startOffset ?? 0) >= 0, `${where}: negative startOffset`);
          assert.ok(layer.peakGain > 0, `${where}: silent layer`);

          if (layer.kind === "tone") {
            // exponentialRampToValueAtTime throws on a non-positive target.
            for (const hz of [
              layer.frequency,
              layer.frequencyEnd,
              layer.lowpass,
              layer.lowpassEnd,
            ]) {
              if (hz === undefined) continue;
              // Pitch/filter frequencies stay inside the range every device can reproduce and below Nyquist, even after the error variant's downward shift/detune.
              assert.ok(hz >= 40 && hz <= 12000, `${where}: frequency ${hz} out of range`);
            }
            assert.ok(layer.peakGain <= 0.12, `${where}: tone too loud`);
            if (layer.sweepTime !== undefined) {
              assert.ok(
                layer.sweepTime > 0 && layer.sweepTime <= layer.duration,
                `${where}: sweep`,
              );
            }
          } else {
            assert.ok(layer.filterFrom >= 40 && layer.filterFrom <= 12000, `${where}: filterFrom`);
            if (layer.filterTo !== undefined) {
              assert.ok(layer.filterTo >= 40 && layer.filterTo <= 12000, `${where}: filterTo`);
            }
            assert.ok(layer.filterQ > 0 && layer.filterQ <= 20, `${where}: filterQ`);
            // Narrow-band noise carries little energy per unit of gain, so it needs more headroom than a tone.
            assert.ok(layer.peakGain <= 0.7, `${where}: noise too loud`);
          }
        }
      }
    }
  }
});

test("keystroke takes are short and quiet enough to repeat with every press", () => {
  for (const pack of LAYERED_SOUND_PACK_NAMES) {
    for (const take of LAYERED_SOUND_PACKS[pack].letter) {
      assert.ok(takeEnd(take) <= 0.22, `${pack}: a keystroke sound should end within 220ms`);
      const tonePeak = take
        .filter((layer) => layer.kind === "tone")
        .reduce((sum, layer) => sum + layer.peakGain, 0);
      // The loudest original pack's single tone peaks at 0.11.
      assert.ok(tonePeak <= 0.14, `${pack}: stacked tone layers peak at ${tonePeak}`);
    }
  }
});

test("error and completion sounds are bounded too", () => {
  for (const pack of LAYERED_SOUND_PACK_NAMES) {
    for (const take of LAYERED_SOUND_PACKS[pack].error) {
      assert.ok(takeEnd(take) <= 0.3, `${pack}: error sound too long`);
    }
    for (const take of LAYERED_SOUND_PACKS[pack].complete) {
      assert.ok(takeEnd(take) <= 0.6, `${pack}: completion sound too long`);
    }
  }
});

test("an error sound sits lower than the pack's correct-keystroke sound", () => {
  for (const pack of LAYERED_SOUND_PACK_NAMES) {
    const pitched = (take: SoundTake) =>
      take.flatMap((layer) => (layer.kind === "tone" ? [layer.frequency] : [layer.filterFrom]));
    const letterLowest = Math.min(...pitched(LAYERED_SOUND_PACKS[pack].letter[0]!));
    const errorLowest = Math.min(...pitched(LAYERED_SOUND_PACKS[pack].error[0]!));
    assert.ok(errorLowest < letterLowest, `${pack}: error should be lower than letter`);
  }
});

test("packs advertised as having variations really have several distinct takes", () => {
  let withVariations = 0;
  for (const pack of LAYERED_SOUND_PACK_NAMES) {
    const takes = LAYERED_SOUND_PACKS[pack].letter;
    assert.equal(getSoundPackVariationCount(pack), takes.length);
    assert.equal(new Set(takes.map((take) => JSON.stringify(take))).size, takes.length, pack);
    if (takes.length >= 2) withVariations += 1;
  }
  assert.equal(withVariations, LAYERED_SOUND_PACK_NAMES.length, "every layered pack varies");
  for (const pack of Object.keys(SOUND_PACKS)) {
    assert.equal(getSoundPackVariationCount(pack as never), 1, `${pack} is a single sound`);
  }
});

// --- The Premium Buttons collection must stay button presses, never beeps ---

test("every premium button opens with a sharp noise transient and never sustains a tone", () => {
  for (const pack of BUTTON_SOUND_PACK_NAMES) {
    for (const take of BUTTON_SOUND_PACKS[pack].letter) {
      const opening = take.filter((layer) => (layer.startOffset ?? 0) === 0);
      const transients = opening.filter(
        (layer) =>
          layer.kind === "noise" && layer.duration <= 0.012 && (layer.attack ?? 0.004) <= 0.001,
      );
      assert.ok(transients.length >= 1, `${pack}: a press starts with a click transient`);

      for (const layer of take) {
        if (layer.kind !== "tone") continue;
        assert.ok(layer.duration <= 0.075, `${pack}: a ring/thump this long reads as a note`);
        assert.ok((layer.attack ?? 0.004) <= 0.002, `${pack}: tones start instantly, no swell`);
      }
      assert.ok(takeEnd(take) <= 0.13, `${pack}: a button press (with release) stays under 130ms`);
    }
  }
});

test("premium button packs are three tunings of one button (a rotation, never a repeat)", () => {
  for (const pack of BUTTON_SOUND_PACK_NAMES) {
    assert.equal(BUTTON_SOUND_PACKS[pack].letter.length, 3, pack);
    assert.equal(BUTTON_SOUND_PACKS[pack].order, undefined, `${pack} rotates randomly`);
  }
});

// --- Take rotation ---

test("pickTakeIndex: a single take is always take 0", () => {
  assert.equal(pickTakeIndex(1, "random", undefined), 0);
  assert.equal(pickTakeIndex(1, "random", 0), 0);
  assert.equal(pickTakeIndex(1, "sequence", 0), 0);
});

test("pickTakeIndex (random): never repeats the previous take and reaches every take", () => {
  for (const count of [2, 3, 4, 5, 6]) {
    const random = seeded(count * 101);
    const reached = new Set<number>();
    let previous: number | undefined;
    for (let i = 0; i < 2000; i += 1) {
      const next = pickTakeIndex(count, "random", previous, random);
      assert.ok(next >= 0 && next < count, `index ${next} in range for count ${count}`);
      if (previous !== undefined) assert.notEqual(next, previous, "same take twice in a row");
      reached.add(next);
      previous = next;
    }
    assert.equal(reached.size, count, `every one of ${count} takes gets played`);
  }
});

test("pickTakeIndex (random): the extremes of the random range stay in bounds and skip the previous take", () => {
  for (const count of [2, 3, 6]) {
    for (let previous = 0; previous < count; previous += 1) {
      for (const r of [0, 0.5, 0.999999]) {
        const next = pickTakeIndex(count, "random", previous, () => r);
        assert.ok(next >= 0 && next < count);
        assert.notEqual(next, previous);
      }
    }
  }
});

test("pickTakeIndex (sequence): cycles in order — tick, tock, tick, tock", () => {
  const order: number[] = [];
  let previous: number | undefined;
  for (let i = 0; i < 6; i += 1) {
    previous = pickTakeIndex(2, "sequence", previous);
    order.push(previous);
  }
  assert.deepEqual(order, [0, 1, 0, 1, 0, 1]);
});

test("detuneRatio/jitterRatio stay inside their configured bounds", () => {
  const random = seeded(7);
  for (let i = 0; i < 1000; i += 1) {
    const cents = detuneRatio(30, random);
    assert.ok(cents >= 2 ** (-30 / 1200) - 1e-9 && cents <= 2 ** (30 / 1200) + 1e-9);
    const gain = jitterRatio(0.1, random);
    assert.ok(gain >= 0.9 - 1e-9 && gain <= 1.1 + 1e-9);
  }
  assert.equal(detuneRatio(0, random), 1);
  assert.equal(jitterRatio(0, random), 1);
});

// --- The persisted selection: the database constraint must accept every selectable pack ---

test("the latest sound_pack check constraint in supabase/migrations lists exactly the selectable packs", () => {
  const dir = join(process.cwd(), "supabase", "migrations");
  const latest = readdirSync(dir)
    .filter((file) => file.endsWith(".sql"))
    .sort()
    .map((file) => readFileSync(join(dir, file), "utf8"))
    .filter((sql) => /add constraint typing_sound_settings_sound_pack_check/i.test(sql))
    .at(-1);
  assert.ok(latest, "a migration defines typing_sound_settings_sound_pack_check");

  const list = /sound_pack in \(([^)]*)\)/i.exec(latest)?.[1];
  assert.ok(list, "constraint has an IN (...) list");
  const allowed = [...list.matchAll(/'([^']+)'/g)].map((match) => match[1]!);

  assert.deepEqual([...allowed].sort(), [...SOUND_PACK_NAMES].sort());
});

// --- Playback scheduling (with a recording stand-in for the Web Audio graph) ---

interface Recorded {
  oscillators: number;
  noiseSources: number;
  filters: number;
  gains: number;
  gainPeaks: number[];
  starts: number[];
  exponentialTargets: number[];
}

function fakeContext(): { ctx: BaseAudioContext; recorded: Recorded } {
  const recorded: Recorded = {
    oscillators: 0,
    noiseSources: 0,
    filters: 0,
    gains: 0,
    gainPeaks: [],
    starts: [],
    exponentialTargets: [],
  };
  const param = (onRamp?: (value: number) => void) => ({
    setValueAtTime() {},
    linearRampToValueAtTime: (value: number) => onRamp?.(value),
    exponentialRampToValueAtTime: (value: number) => recorded.exponentialTargets.push(value),
    value: 0,
  });
  const node = () => ({ connect() {}, disconnect() {} });
  const ctx = {
    sampleRate: 44100,
    createBuffer: (_channels: number, length: number) => ({
      getChannelData: () => new Float32Array(length),
    }),
    createGain() {
      recorded.gains += 1;
      return { ...node(), gain: param((value) => recorded.gainPeaks.push(value)) };
    },
    createOscillator() {
      recorded.oscillators += 1;
      return {
        ...node(),
        type: "sine",
        frequency: param(),
        start: (when: number) => recorded.starts.push(when),
        stop() {},
      };
    },
    createBiquadFilter() {
      recorded.filters += 1;
      return { ...node(), type: "lowpass", frequency: param(), Q: param() };
    },
    createBufferSource() {
      recorded.noiseSources += 1;
      return {
        ...node(),
        buffer: null,
        start: (when: number) => recorded.starts.push(when),
        stop() {},
      };
    },
  } as unknown as BaseAudioContext;
  return { ctx, recorded };
}

test("scheduleTake builds one envelope per layer and the right source for each layer kind", () => {
  for (const pack of LAYERED_SOUND_PACK_NAMES) {
    for (const variant of VARIANTS) {
      for (const take of LAYERED_SOUND_PACKS[pack][variant]) {
        const { ctx, recorded } = fakeContext();
        scheduleTake(ctx, {} as AudioNode, take, 5, { gainScale: 1 });

        const tones = take.filter((layer) => layer.kind === "tone").length;
        assert.equal(recorded.oscillators, tones, `${pack}.${variant} oscillators`);
        assert.equal(recorded.noiseSources, take.length - tones, `${pack}.${variant} noise`);
        assert.equal(recorded.gains, take.length, `${pack}.${variant} envelopes`);
        assert.ok(
          recorded.starts.every((when) => when >= 5),
          "nothing starts before the take",
        );
        assert.ok(
          recorded.exponentialTargets.every((value) => value > 0),
          `${pack}.${variant}: exponential ramps need positive targets`,
        );
      }
    }
  }
});

test("scheduleTake applies gainScale, gainRatio and pitchRatio", () => {
  const take = LAYERED_SOUND_PACKS.marimba.letter[0]!;

  const base = fakeContext();
  scheduleTake(base.ctx, {} as AudioNode, take, 0, { gainScale: 1 });
  const scaled = fakeContext();
  scheduleTake(scaled.ctx, {} as AudioNode, take, 0, {
    gainScale: 2.2 * 0.6,
    gainRatio: 0.5,
    pitchRatio: 1.01,
  });

  base.recorded.gainPeaks.forEach((peak, index) => {
    assert.ok(Math.abs(scaled.recorded.gainPeaks[index]! - peak * 2.2 * 0.6 * 0.5) < 1e-9);
  });
});

test("scheduleTake with zero volume produces silent envelopes (the hook also skips playback entirely)", () => {
  const { ctx, recorded } = fakeContext();
  scheduleTake(ctx, {} as AudioNode, LAYERED_SOUND_PACKS.glass.letter[0]!, 0, { gainScale: 0 });
  assert.ok(recorded.gainPeaks.every((peak) => peak === 0));
});
