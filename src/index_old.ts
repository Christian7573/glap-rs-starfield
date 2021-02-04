import { RandomContainer, RandomAreaPoint } from "./random";
import seedrandom from "seedrandom";
export { default as SvgRenderer } from "./svg";

type MyRandom = seedrandom.prng;

export class GlapRsStarfield {
	foreground_layer: StarfieldLayer;
	middle_layer: StarfieldLayer;
	background_layer: StarfieldLayer;
	chunk_size = 200;

	constructor(seed: string) {
		this.foreground_layer = new StarfieldLayer(seed + "_f", StarfieldChunkGenerator.foreground_layer(), this.chunk_size, 12);
		this.middle_layer = new StarfieldLayer(seed + "_m", StarfieldChunkGenerator.middle_layer(), this.chunk_size * 2, 8);
		this.background_layer = new StarfieldLayer(seed + "_b", StarfieldChunkGenerator.background_layer(), this.chunk_size * 4, 4);
	}

	viewpoints = [
		new GlapRsViewspot(this, -100, -100, this.chunk_size),
		new GlapRsViewspot(this,  100, -100, this.chunk_size),
		new GlapRsViewspot(this, -100,  100, this.chunk_size),
		new GlapRsViewspot(this,  100,  100, this.chunk_size)
	];
	update_player_position(x: number, y: number): boolean {
		let return_val = false;
		for (const viewpoint of this.viewpoints) return_val = viewpoint.update_player_position(x, y) || return_val;
		return return_val;
	}
}
export default GlapRsStarfield;

class GlapRsViewspot {
	starfield: GlapRsStarfield;
	offset_x: number;
	offset_y: number;
	last_chunk_x = 100000;
	last_chunk_y = 100000;
	chunk_size: number;

	constructor(starfield: GlapRsStarfield, offset_x: number, offset_y: number, chunk_size: number) {
		this.starfield = starfield;
		this.offset_x = offset_x;
		this.offset_y = offset_y;
		this.chunk_size = chunk_size;
	}
	update_player_position(player_x: number, player_y: number): boolean {
		const x = player_x + this.offset_x;
		const y = player_y + this.offset_y;
		const chunk_x = Math.floor(x / this.chunk_size);
		const chunk_y = Math.floor(y / this.chunk_size);
		if (chunk_x !== this.last_chunk_x || chunk_y !== this.last_chunk_y) {
			this.last_chunk_x = chunk_x;
			this.last_chunk_y = chunk_y;
			this.starfield.foreground_layer.ensure_chunk(chunk_x, chunk_y);
			this.starfield.middle_layer.ensure_chunk(Math.floor(chunk_x / 2), Math.floor(chunk_y / 2));
			this.starfield.background_layer.ensure_chunk(Math.floor(chunk_x / 4), Math.floor(chunk_y / 4));
			return true;
		}
		return false;
	}

}

export class StarfieldLayer {
	chunks = new Map<string, StarfieldChunk>();
	chunks_ordered: string[] = [];
	chunk_size: number;
	max_chunks: number;
	seed: string;
	generator: StarfieldChunkGenerator;

	constructor(seed: string, generator: StarfieldChunkGenerator, chunk_size: number, max_chunks: number) {
		this.seed = seed;
		this.generator = generator;
		this.chunk_size = chunk_size;
		this.max_chunks = max_chunks;
	}

	ensure_chunk(chunk_x: number, chunk_y: number) {
		const addr = `${chunk_x},${chunk_y}`;
		const chunk = this.chunks.get(addr);
		if (chunk == null) {
			const chunk = this.generator.generate(seedrandom(`{this.seed}_{chunk_x}_{chunk_y}`), this.chunk_size);
			chunk.x = chunk_x;
			chunk.y = chunk_y;
			this.chunks.set(addr, chunk);
			this.chunks_ordered.push(addr);
			if (this.chunks_ordered.length > this.max_chunks) {
				const removed_chunk = this.chunks_ordered[0];
				this.chunks_ordered.splice(0,1);
				this.chunks.delete(removed_chunk);
			}
		} else {
			this.chunks_ordered.splice(this.chunks_ordered.indexOf(addr), 1);
			this.chunks_ordered.push(addr);
		}
	}
}

export class StarfieldChunk {
	stars: Star[] = [];
	nebula_fogs: NebulaFog[] = [];
	x: number;
	y: number;
}

export class Star {
	readonly x: number;
	readonly y: number;
	readonly size: number;
	readonly color: number;
	readonly kind: StarKind;

	constructor(x: number, y: number, size: number, color: number, kind: StarKind) {
		this.x = x;
		this.y = y;
		this.size = size;
		this.color = color;
		this.kind = kind;
	}
}
export class NebulaFog {
	x: number;
	y: number;
	radians: number;
	size: number;
	color: number;
	opacity: number;
}
export enum StarKind {
	Star,
	TopHat, //Easter eggs go brrrrrr
	OldLogo,
}


export class StarfieldChunkGenerator {
	/*tophat_threshold = 0.95;
	small_star_threshold = 0.8;
	medium_star_threshold = 0.85;
	large_star_threshold = 0.9;*/
	
   	max_tophats = 0;
	max_small_stars = 0;
	max_medium_stars = 0;
	max_large_stars = 0;
	forced_small_stars = 0;
	forced_medium_stars = 0;
	forced_large_stars = 0;

	/*small_star_size = 3 / 30;
	medium_star_size = 8 / 30;
	large_star_size = 15 / 30;*/
	small_star_size = 8 / 30;
	medium_star_size = 10 / 30;
	large_star_size = 15 / 30;
   	/*small_star_size = 10;
	medium_star_size = 10;
	large_star_size = 10;*/

	random: MyRandom;
	chunk: StarfieldChunk;
	size: number;
	max_skip = 5;

	generate(random: MyRandom, size: number): StarfieldChunk {
		this.random = random;
		this.chunk = new StarfieldChunk();
		this.size = size;

		this.add_stars(this.max_small_stars, this.forced_small_stars, this.small_star_size, 0xffdad4, StarKind.Star);
		this.add_stars(this.max_medium_stars, this.forced_medium_stars, this.medium_star_size, 0xffffd4, StarKind.Star);
		this.add_stars(this.max_large_stars, this.forced_large_stars, this.large_star_size, 0xffffff, StarKind.Star);
		
		return this.chunk;
	}

	add_stars(max_stars: number, forced_stars: number, size: number, color: number, kind: StarKind) {
		const stars = Math.round(this.random() * max_stars) + forced_stars;
		for (let i = 0; i < stars; i++) {
			const x = Math.round(this.random() * this.size);
			const y = Math.round(this.random() * this.size);
			this.chunk.stars.push(new Star(x, y, size, color, kind));

			const skip_count = Math.round(this.random() * this.max_skip);
			for (let i = 0; i < skip_count; i++) this.random();
		}
	}

	points_above_threshold(random: RandomContainer, size: number, threshold: number): [number, number][] {
		const out: [number, number][] = [];
		for (const position of random.iter(size, size)) {
			if (position.vx >= threshold && position.vy >= threshold) out.push([position.x, position.y]);
		}
		return out;
	}

	static foreground_layer(): StarfieldChunkGenerator {
		const gen = new StarfieldChunkGenerator();
		gen.max_large_stars = 1000;
		gen.forced_large_stars = 1000;
		return gen;
	}
	static middle_layer(): StarfieldChunkGenerator {
		const gen = new StarfieldChunkGenerator();
		gen.max_medium_stars = 5000;
		gen.forced_medium_stars = 5000;
		return gen;
	}
	static background_layer(): StarfieldChunkGenerator {
		const gen = new StarfieldChunkGenerator();
		gen.max_small_stars = 30000;
		gen.forced_small_stars = 30000;
		return gen;
	}
}
