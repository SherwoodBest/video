import timeline from './timeline.json';
import {beatGrid} from '../lib/beat';

export const {FPB, bf, section, TOTAL_FRAMES} = beatGrid(timeline);
export const LINES_SECTION = timeline.sections.lines;
