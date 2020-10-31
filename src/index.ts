import { RandomContainer, RandomAreaPoint } from "./random";

export class Starfield {

}

export class StarfieldChunk {
	stars: Star[];
	nebula_fogs: NebulaFog[];
}

export class Star {
	x: number;
	y: number;
	size: number;
	color: number;
}
export class NebulaFog {
	x: number;
	y: number;
	radians: number;
	size: number;
	color: number;
	opacity: number;
}
export enum StarType {
	Star,
	TopHat, //Easter eggs go brrrrrr
	OldLogo,
}

export class StarfieldChunkGenerator {

}
