import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getFreeLessons, getLessons, getSentenceCount } from "@/data/lessons";
import { LEARNING_MODES, modeMeta } from "@/lib/learning-modes";

export function ModeSection() {
  return (
    <section id="modes" className="mx-auto max-w-6xl px-6 py-20">
      <div className="mx-auto mb-12 max-w-2xl text-center">
        <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
          Three ways to build fluency
        </h2>
        <p className="text-muted-foreground mt-3 text-lg text-balance">
          Every mode uses the same simple loop: hear the sentence, type it, feel it lock in.
        </p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {LEARNING_MODES.map((mode, index) => {
          const copy = modeMeta[mode];
          const Icon = copy.icon;
          const totalLessons = getLessons(mode).length;
          const freeLessons = getFreeLessons(mode).length;
          const sentences = getSentenceCount(mode);

          return (
            <Card
              key={mode}
              className="animate-rise-in transition-shadow duration-300 [animation-fill-mode:backwards] hover:shadow-md"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <CardHeader>
                <div className="bg-brand-muted text-primary mb-2 flex size-11 items-center justify-center rounded-lg">
                  <Icon className="size-5" aria-hidden="true" />
                </div>
                <CardTitle className="text-xl">{copy.title}</CardTitle>
                <CardDescription>{copy.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-muted-foreground flex items-center justify-between text-sm">
                  <span>
                    {totalLessons} lessons · {sentences} sentences
                  </span>
                  <span className="text-success font-medium">{freeLessons} free</span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </section>
  );
}
