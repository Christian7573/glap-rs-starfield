import { RandomContainer, RandomAreaPoint } from "./random";
import seedrandom from "seedrandom";
export { default as SvgRenderer } from "./svg";

type MyRandom = seedrandom.prng;

enum ObjKind {
	Square,
	Triangle,
	WackTriangle,
	NebulaCloud,
}

type OutputFunc = (kind: ObjKind, x: number, y: number, rot: number, size: number, color: number) => void;

export function populate_with_randomly(rng: MyRandom, kinds: ObjKind[], count: [number, number], sizes: [number, number], colors: number[], max_pos: number, output: OutputFunc) {
	const objects = ((count[1] - count[0]) * rng()) + count[0];
	for (let _i = 0; _i < objects; _i++) {
		const x = rng() * max_pos;
		const y = rng() * max_pos;
		const kind = kinds[Math.floor(rng() * kinds.length)];
		const size = ((sizes[1] - sizes[0]) * rng()) + sizes[0];
		const color = colors[Math.floor(rng() * colors.length)];
		const rot = rng() * Math.PI * 2;
		output(kind, x, y, rot, size, color);
	}
}

export function populate_with_branch(rng: MyRandom, kinds: ObjKind[], branch_continuity: number, continuity_decrease: number, base_pos: [number, number], offset: [number, number], rot_range: [number, number], colors: number[], sizes: [number, number], output: OutputFunc) {
	const kind = kinds[Math.floor(rng() * kinds.length)];
	const size = ((sizes[1] - sizes[0]) * rng()) + sizes[0];
	const color = colors[Math.floor(rng() * colors.length)];
	const my_rot = rng() * Math.PI * 2;
	output(kind, base_pos[0], base_pos[1], my_rot, size, color);

	while (rng() <= branch_continuity) {
		branch_continuity -= continuity_decrease;
		const length = ((offset[1] - offset[0]) * rng()) + offset[0];
		const rot = ((rot_range[1] - rot_range[0]) * rng()) + rot_range[0];
		const x = Math.cos(rot) * length;
		const y = Math.sin(rot) * length;
		const new_rots: [number, number] = [rot - ((rot_range[1] - rot_range[0]) * 0.25), rot + ((rot_range[1] - rot_range[0]) * 0.25)];
		populate_with_branch(rng, kinds, branch_continuity, continuity_decrease, [base_pos[0] + x, base_pos[1] + y], offset, new_rots, colors, sizes, output);
	}
}

export class StarfieldChunkGenerator {
   	max_tophats = 0;
	max_small_stars = 0;
	max_medium_stars = 0;
	max_large_stars = 0;
	forced_small_stars = 0;
	forced_medium_stars = 0;
	forced_large_stars = 0;

	small_star_size = 8 / 30;
	medium_star_size = 10 / 30;
	large_star_size = 15 / 30;

	random: MyRandom;
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
