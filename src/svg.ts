import { GlapRsStarfield, StarfieldChunk, Star, StarKind } from "./index";

export default class SvgRenderer {
	starfield: GlapRsStarfield;
	rendered_chunks: Map<StarfieldChunk, SVGElement> = new Map();
	root: SVGElement;
	foreground_layer: SVGGElement;
	middle_layer: SVGGElement;
	background_layer: SVGGElement;
	chunk_size: number;
	
	constructor(starfield: GlapRsStarfield, render_inside: SVGElement, chunk_size: number) {
		this.starfield = starfield;
		this.root = render_inside;
		this.foreground_layer = document.createElementNS("http://www.w3.org/2000/svg", "g");
		this.middle_layer = document.createElementNS("http://www.w3.org/2000/svg", "g");
		this.background_layer = document.createElementNS("http://www.w3.org/2000/svg", "g");
		this.chunk_size = chunk_size;
	}

	update_player_position(x: number, y: number) {
		this.foreground_layer.style.transform = `translate(${-x}px, ${y}px)`;
		this.middle_layer.style.transform = `translate(${-x / 2}px, ${-y / 2}px)`;
		this.background_layer.style.transform = `translate(${-x / 4}px, ${-y / 4}px)`;
	}

	update_chunks() {
		const to_delete = [];
		for (const chunk of this.rendered_chunks.keys()) to_delete.push(chunk);
		
		for (const chunk of this.starfield.foreground_layer.chunks.values()) {
			const i = to_delete.indexOf(chunk);
			if (i < 0) {
				const rendered_chunk = this.render_chunk(chunk);
				rendered_chunk.style.transform = `translate(${chunk.x * this.chunk_size}px, ${chunk.y * this.chunk_size}px)`;
				this.rendered_chunks.set(chunk, rendered_chunk);
				this.foreground_layer.appendChild(rendered_chunk);
			} else {
				to_delete.splice(i, 1);
			}
		}

		for (const chunk of this.starfield.middle_layer.chunks.values()) {
			const i = to_delete.indexOf(chunk);
			if (i < 0) {
				const rendered_chunk = this.render_chunk(chunk);
				rendered_chunk.style.transform = `translate(${chunk.x * this.chunk_size * 2}px, ${chunk.y * this.chunk_size * 2}px)`;
				this.rendered_chunks.set(chunk, rendered_chunk);
				this.middle_layer.appendChild(rendered_chunk);
			} else {
				to_delete.splice(i, 1);
			}
		}

		for (const chunk of this.starfield.background_layer.chunks.values()) {
			const i = to_delete.indexOf(chunk);
			if (i < 0) {
				const rendered_chunk = this.render_chunk(chunk);
				rendered_chunk.style.transform = `translate(${chunk.x * this.chunk_size * 4}px, ${chunk.y * this.chunk_size * 4}px)`;
				this.rendered_chunks.set(chunk, rendered_chunk);
				this.background_layer.appendChild(rendered_chunk);
			} else {
				to_delete.splice(i, 1);
			}
		}
	}

	render_chunk(chunk: StarfieldChunk): SVGGElement {
		const out = document.createElementNS("http://www.w3.org/2000/svg", "g");

		for (const star of chunk.stars) {
			switch (star.kind) {
				case StarKind.Star: {
					const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
					const half_size = star.size / 2;
					rect.setAttribute("x", (star.x - half_size) as any);
					rect.setAttribute("y", (star.y - half_size) as any);
					rect.setAttribute("width", star.size as any);
					rect.setAttribute("height", star.size as any);
					rect.setAttribute("transform", `rotate(${Math.floor(Math.random() * 360)})`);
					rect.setAttribute("fill", "#" + star.color.toString(16));
					out.appendChild(rect);
				}; break;

				default: throw new Error("Unimplemented star type");
			}
		}


		return out;
	}
}
