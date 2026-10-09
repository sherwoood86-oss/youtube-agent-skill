import { Composition } from "remotion";
import { Edit, EditProps } from "./Edit";
import { TextShort, TextShortProps, textShortFrames } from "./TextShort";
import { BrawlerShort, BRAWLER_FRAMES } from "./BrawlerShort";
import example from "../examples/text-short.json";

// Placeholder props so the studio opens before props.py has run. Real renders pass --props.
const empty: EditProps = {
  src: "video.mp4",
  fps: 30,
  width: 1920,
  height: 1080,
  durationInFrames: 30,
  segments: [],
  captions: [],
};

export const Root: React.FC = () => (
  <>
  <Composition
    id="Edit"
    component={Edit}
    defaultProps={empty}
    durationInFrames={empty.durationInFrames}
    fps={empty.fps}
    width={empty.width}
    height={empty.height}
    // Size, rate and length all come from props.py, so a Short and a long edit share one composition.
    calculateMetadata={({ props }) => ({
      durationInFrames: props.durationInFrames,
      fps: props.fps,
      width: props.width,
      height: props.height,
    })}
  />
  <Composition
    id="TextShort"
    component={TextShort}
    defaultProps={example as TextShortProps}
    durationInFrames={textShortFrames(example as TextShortProps)}
    fps={30}
    width={1080}
    height={1920}
    calculateMetadata={({ props }) => ({ durationInFrames: textShortFrames(props), fps: props.fps })}
  />
  <Composition id="Brawler" component={BrawlerShort} durationInFrames={BRAWLER_FRAMES} fps={30} width={1080} height={1920} />
  </>
);
