import React from "react";
import { AbsoluteFill, Composition, Freeze, Sequence } from "remotion";
import { HANDOFF, SCENES, VIDEO } from "./theme";
import { Hook } from "./scenes/Hook";
import { Problem, PROBLEM_LEAD } from "./scenes/Problem";
import { Fix } from "./scenes/Fix";
import { Payoff } from "./scenes/Payoff";
import { MatchCut } from "./scenes/MatchCut";
import { Soundtrack } from "./Soundtrack";
import { Grain, Vignette } from "./components/Backdrop";
import { GRAIN } from "./theme";

// Layer order matters: later children draw on top.
//  · Problem starts PROBLEM_LEAD frames early (transparent) so its code-host window fades up behind the Hook (1D).
//  · Scene 3's first frame sits frozen under Problem for the last HANDOFF.wipeLead frames; the violet band reveals it (2D).
//  · MatchCut draws above everything for the 14f "47" flight.
export const LaunchVideo: React.FC = () => {
  return (
    <AbsoluteFill>
      <Sequence from={SCENES.hook.from} durationInFrames={SCENES.hook.duration} name="1 Hook">
        <Hook />
      </Sequence>
      <Sequence from={SCENES.fix.from - HANDOFF.wipeLead} durationInFrames={HANDOFF.wipeLead} name="3 Fix (frozen under 2D wipe)">
        <Freeze frame={0}>
          <Fix />
        </Freeze>
      </Sequence>
      <Sequence
        from={SCENES.problem.from - PROBLEM_LEAD}
        durationInFrames={SCENES.problem.duration + PROBLEM_LEAD}
        name="2 Problem"
      >
        <Problem />
      </Sequence>
      <Sequence from={SCENES.fix.from} durationInFrames={SCENES.fix.duration} name="3 Fix">
        <Fix />
      </Sequence>
      <Sequence from={SCENES.payoff.from} durationInFrames={SCENES.payoff.duration} name="4 Payoff">
        <Payoff />
      </Sequence>
      <Sequence from={SCENES.hook.duration - HANDOFF.matchCut} durationInFrames={HANDOFF.matchCut + 6} name="1D Match cut">
        <MatchCut />
      </Sequence>
      <Vignette />
      {GRAIN.enabled ? <Grain opacity={GRAIN.opacity} /> : null}
      <Soundtrack />
    </AbsoluteFill>
  );
};

export const MyComposition = () => {
  return (
    <Composition
      id="PatchnoteLaunch"
      component={LaunchVideo}
      durationInFrames={VIDEO.durationInFrames}
      fps={VIDEO.fps}
      width={VIDEO.width}
      height={VIDEO.height}
    />
  );
};
