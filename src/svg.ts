import { GlapRsStarfield, StarfieldChunk, StarfieldLayer, Star, StarKind } from "./index";

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
		this.root.appendChild(this.background_layer);
		this.root.appendChild(this.middle_layer);
		this.root.appendChild(this.foreground_layer);
		this.chunk_size = chunk_size;
	}

	update_player_position(x: number, y: number) {
		this.foreground_layer.style.transform = `translate(${-x}px, ${y}px)`;
		this.middle_layer.style.transform = `translate(${-x / 2}px, ${-y / 2}px)`;
		this.background_layer.style.transform = `translate(${-x / 4}px, ${-y / 4}px)`;
		if (this.starfield.update_player_position(x, y)) this.update_chunks();
	}

	update_chunks() {
		const to_delete: StarfieldChunk[] = [];
		for (const chunk of this.rendered_chunks.keys()) to_delete.push(chunk);

		const update_layer = (layer: StarfieldLayer, rendering_layer: SVGGElement) => {
			for (const chunk of layer.chunks.values()) {
				const i = to_delete.indexOf(chunk);
				if (i < 0) {
					const rendered_chunk = this.render_chunk(chunk);
					rendered_chunk.style.transform = `translate(${chunk.x * this.chunk_size}px, ${chunk.y * this.chunk_size}px)`;
					this.rendered_chunks.set(chunk, rendered_chunk);
					rendering_layer.appendChild(rendered_chunk);
				} else {
					to_delete.splice(i, 1);
				}
			}
		}
		update_layer(this.starfield.foreground_layer, this.foreground_layer);
		update_layer(this.starfield.middle_layer, this.middle_layer);
		update_layer(this.starfield.background_layer, this.background_layer);
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
					//rect.setAttribute("transform", `rotate(${Math.floor(Math.random() * 360)})`);
					rect.setAttribute("fill", "#" + star.color.toString(16));
					out.appendChild(rect);
				}; break;

				default: throw new Error("Unimplemented star type");
			}
		}


		return out;
	}
}
