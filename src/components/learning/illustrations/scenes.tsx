import {
  BackpackProp,
  BagProp,
  BookProp,
  CalendarProp,
  CupProp,
  Hair,
  Head,
  HeartProp,
  HouseProp,
  LaptopProp,
  Limb,
  PaperPlaneProp,
  PlateProp,
  Scene,
  SpeechBubbleProp,
  StethoscopeProp,
  SuitcaseProp,
  Surface,
  Torso,
} from "./parts";

/**
 * One composition per real lesson (plus one generic fallback per mode),
 * each built from the same shared parts in parts.tsx so proportions, line
 * weight, and the two-color palette never drift between scenes even though
 * every pose is authored individually. Every figure is doing something
 * concretely tied to that lesson's topic, per the brief — never just a
 * generic person with an unrelated icon floating nearby.
 *
 * Torso (see parts.tsx) is a shoulders-to-waist outline that widens toward
 * the bottom crop, spanning roughly x:58–142 by y:150 and x:55–145 at the
 * very bottom edge. Every side-carried prop below is deliberately kept at
 * x<=44 or x>=156 so it sits clearly beside that outline instead of
 * appearing stuck inside it; every "held in both hands" prop is centered
 * with both arms visibly converging on its edges instead of ending short,
 * so it reads as grasped rather than floating.
 */

function WaveArm() {
  return (
    <>
      <Limb d="M121 98 Q141 84 146 54" />
      <Limb d="M146 54 Q152 46 148 40" strokeWidth={4} />
      <Limb d="M140 42 Q145 36 141 32" strokeWidth={3.5} opacity={0.6} />
    </>
  );
}

/** A short arm that peels away from the shoulder and stays high — an idle pose that never travels down into the torso's wider lower silhouette. */
function RestingArm({ side }: { side: "left" | "right" }) {
  const d = side === "left" ? "M79 100 Q58 112 46 122" : "M121 100 Q142 112 154 122";
  return <Limb d={d} />;
}

export function IntroducingYourselfScene() {
  return (
    <Scene>
      <Torso />
      <Hair variant="side" />
      <Head lookOffsetX={4} />
      <WaveArm />
      <RestingArm side="left" />
      <SpeechBubbleProp x={50} y={68} scale={0.85} />
    </Scene>
  );
}

export function DailyRoutineScene() {
  return (
    <Scene>
      <Torso />
      <Hair variant="short" />
      <Head lookOffsetX={-3} />
      <Limb d="M79 100 Q56 110 40 120" />
      <RestingArm side="right" />
      <CupProp x={38} y={122} scale={0.9} />
    </Scene>
  );
}

export function FamilyAndHomeScene() {
  return (
    <Scene>
      <g transform="translate(-50 16) scale(0.58)">
        <Torso />
        <Hair variant="bun" />
        <Head />
      </g>
      <g transform="translate(50 10) scale(0.6)">
        <Torso />
        <Hair variant="short" />
        <Head lookOffsetX={-3} />
      </g>
      <HouseProp x={98} y={10} scale={0.5} />
    </Scene>
  );
}

export function ShoppingScene() {
  return (
    <Scene>
      <Torso />
      <Hair variant="side" />
      <Head lookOffsetX={3} />
      <Limb d="M121 100 Q144 122 160 148" />
      <RestingArm side="left" />
      <BagProp x={161} y={150} scale={0.9} />
    </Scene>
  );
}

export function FoodAndRestaurantsScene() {
  return (
    <Scene>
      <Surface y={178} />
      <Torso />
      <Hair variant="short" />
      <Head />
      <Limb d="M79 100 Q76 132 87 154" />
      <Limb d="M121 100 Q124 132 113 154" />
      <PlateProp x={100} y={158} scale={0.85} />
    </Scene>
  );
}

export function MakingPlansScene() {
  return (
    <Scene>
      <Torso />
      <Hair variant="bun" />
      <Head lookOffsetX={-4} />
      <Limb d="M79 100 Q78 116 86 128" />
      <Limb d="M121 100 Q122 116 114 128" />
      <CalendarProp x={100} y={130} scale={0.85} />
    </Scene>
  );
}

export function WorkAndColleaguesScene() {
  return (
    <Scene>
      <Surface y={172} />
      <Torso />
      <Hair variant="short" />
      <Head lookOffsetX={2} />
      <Limb d="M79 100 Q78 128 86 148" />
      <Limb d="M121 100 Q122 128 114 148" />
      <LaptopProp x={100} y={150} scale={0.85} />
    </Scene>
  );
}

export function TravelScene() {
  return (
    <Scene>
      <Torso />
      <Hair variant="side" />
      <Head lookOffsetX={4} />
      <BackpackProp x={62} y={72} scale={0.8} />
      <Limb d="M121 100 Q144 122 160 146" />
      <RestingArm side="left" />
      <SuitcaseProp x={161} y={148} scale={0.75} />
      <PaperPlaneProp x={152} y={42} scale={0.55} opacity={0.7} />
    </Scene>
  );
}

export function NewNeighborScene() {
  return (
    <Scene>
      <g transform="translate(-48 16) scale(0.58)">
        <Torso />
        <Hair variant="side" />
        <Head lookOffsetX={5} />
        <WaveArm />
      </g>
      <g transform="translate(48 10) scale(0.6)">
        <Torso />
        <Hair variant="short" />
        <Head lookOffsetX={-4} />
      </g>
      <HeartProp x={98} y={12} scale={0.45} />
    </Scene>
  );
}

export function JobInterviewScene() {
  return (
    <Scene>
      <Surface y={178} />
      <Torso />
      <Hair variant="short" />
      <Head />
      <Limb d="M121 100 Q144 122 160 148" />
      <RestingArm side="left" />
      <SuitcaseProp x={161} y={150} scale={0.8} />
    </Scene>
  );
}

export function HotelCheckInScene() {
  return (
    <Scene>
      <Surface y={178} />
      <Torso />
      <Hair variant="bun" />
      <Head lookOffsetX={3} />
      <Limb d="M79 100 Q56 122 40 148" />
      <RestingArm side="right" />
      <SuitcaseProp x={38} y={150} scale={0.9} />
      <HouseProp x={160} y={38} scale={0.5} opacity={0.65} />
    </Scene>
  );
}

export function DoctorsOfficeScene() {
  return (
    <Scene>
      <Torso />
      <Hair variant="short" />
      <Head />
      <StethoscopeProp x={100} y={110} scale={0.8} />
      <RestingArm side="left" />
      <RestingArm side="right" />
    </Scene>
  );
}

export function NormalModeDefaultScene() {
  return (
    <Scene>
      <Torso />
      <Hair variant="short" />
      <Head />
      <Limb d="M79 100 Q78 124 86 136" />
      <Limb d="M121 100 Q122 124 114 136" />
      <BookProp x={100} y={138} scale={0.9} />
    </Scene>
  );
}

export function StoriesModeDefaultScene() {
  return (
    <Scene>
      <Torso />
      <Hair variant="side" />
      <Head lookOffsetX={-3} />
      <Limb d="M79 100 Q78 130 87 144" />
      <Limb d="M121 100 Q122 130 113 144" />
      <BookProp x={100} y={146} scale={1} />
    </Scene>
  );
}

export function ConversationModeDefaultScene() {
  return (
    <Scene>
      <g transform="translate(-48 16) scale(0.58)">
        <Torso />
        <Hair variant="short" />
        <Head lookOffsetX={4} />
      </g>
      <g transform="translate(48 10) scale(0.6)">
        <Torso />
        <Hair variant="bun" />
        <Head lookOffsetX={-4} />
      </g>
      <SpeechBubbleProp x={65} y={12} scale={0.5} />
      <SpeechBubbleProp x={133} y={22} scale={0.4} opacity={0.75} />
    </Scene>
  );
}
