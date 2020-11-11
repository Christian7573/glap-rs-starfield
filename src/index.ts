import { RandomContainer, RandomAreaPoint } from "./random";
export { default as SvgRenderer } from "./svg";

export class GlapRsStarfield {
	foreground_layer: StarfieldLayer;
	middle_layer: StarfieldLayer;
	background_layer: StarfieldLayer;
	chunk_size = 1000;

	constructor(seed: string) {
		this.foreground_layer = new StarfieldLayer(seed + "_f", StarfieldChunkGenerator.foreground_layer(), this.chunk_size, 5);
		this.middle_layer = new StarfieldLayer(seed + "_m", StarfieldChunkGenerator.middle_layer(), this.chunk_size * 2, 4);
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
			const chunk = this.generator.generate(`${addr}_${chunk_x}`, `${addr}_${chunk_y}`, 1000);
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
	
   	tophat_threshold = 1;
	small_star_threshold = 1;
	medium_star_threshold = 1;
	large_star_threshold = 1;

	small_star_size = 3;
	medium_star_size = 8;
	large_star_size = 15;

	generate(seed_x: string, seed_y: string, size: number): StarfieldChunk {
		const chunk = new StarfieldChunk();

		//Small stars
		for (const [x, y] of this.points_above_threshold(new RandomContainer(seed_x + "_s", seed_y + "_s"), size, this.small_star_threshold)) {
			chunk.stars.push(new Star(x, y, this.small_star_size, 0xffffff, StarKind.Star));
		}

		//Medium stars
		for (const [x, y] of this.points_above_threshold(new RandomContainer(seed_x + "_m", seed_y + "_m"), size, this.medium_star_threshold)) {
			chunk.stars.push(new Star(x, y, this.medium_star_size, 0xffffff, StarKind.Star));
		}

		//Lage stars
		for (const [x, y] of this.points_above_threshold(new RandomContainer(seed_x + "_l", seed_y + "_l"), size, this.large_star_threshold)) {
			chunk.stars.push(new Star(x, y, this.large_star_size, 0xffffff, StarKind.Star));
		}
		
		return chunk;
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
		gen.large_star_threshold = 0.99;
		return gen;
	}
	static middle_layer(): StarfieldChunkGenerator {
		const gen = new StarfieldChunkGenerator();
		gen.medium_star_threshold = 0.98;
		return gen;
	}
	static background_layer(): StarfieldChunkGenerator {
		const gen = new StarfieldChunkGenerator();
		gen.small_star_threshold = 0.95;
		return gen;
	}
}
