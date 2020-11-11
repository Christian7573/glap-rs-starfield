import seedrandom from "seedrandom";

export class RandomContainer {
	private x_random: seedrandom.prng;
	private y_random: seedrandom.prng;
	//readonly step: number;
	private x_values: number[] = [];
	private y_values: number[] = [];

	constructor(x_seed: string, y_seed: string, /*step: number*/) {
		this.x_random = seedrandom(x_seed);
		this.y_random = seedrandom(y_seed);
		//this.step = step;
	}

	get_x(target_x: number) {
		//const target_x = Math.floor(x / step);
		while (this.x_values.length <= target_x) this.x_values.push(this.x_random());
		return this.x_values[target_x];
	}
	get_y(target_y: number) {
		//const target_y = Math.floor(y / step);
		while (this.y_values.length <= target_y) this.y_values.push(this.y_random());
		return this.y_values[target_y];
	}

	iter(size_x: number, size_y: number): RandomAreaIterator { return new RandomAreaIterator(this, size_x, size_y); }
}

export class RandomAreaPoint {
	readonly x: number;
	readonly y: number;
	readonly vx: number;
	readonly vy: number;
	constructor(x: number, y: number, vx: number, vy: number) {
		this.x = x;
		this.y = y;
		this.vx = vx;
		this.vy = vy;
	}
}

export class RandomAreaIterator implements Iterable<RandomAreaPoint> {
	readonly random: RandomContainer;
	readonly size_x: number;
	readonly size_y: number;
	constructor(random: RandomContainer, size_x: number, size_y: number) {
		this.random = random;
		this.size_x = size_x;
		this.size_y = size_y;
	}

	[Symbol.iterator]() {
		let x = 0;
		let y = 0;
		const self = this;
		return {
			next(): IteratorResult<RandomAreaPoint> {
				const result = new RandomAreaPoint(x, y, self.random.get_x(x), self.random.get_y(y));
				x++;
				if (x >= self.size_x) { x = 0; y++; }
				return {
					value: result,
					done: y >= self.size_y
				};
			}
		}
	}
}
