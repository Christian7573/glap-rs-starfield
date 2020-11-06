import { GlapRsStarfield, StarfieldChunk, Star, StarType } from "./index";

export default class SvgRenderer {
	starfield: GlapRsStarfield;
	rendered_chunks: Map<StarfieldChunk, SVGElement> = new Map();
	root: SVGElement;
	foreground_layer: SVGGElement;
	middle_layer: SVGGElement;
	background_layer: SVGGElement;
	
	constructor(starfield: GlapRsStarfield, render_inside: SVGElement) {
		this.starfield = starfield;
		this.root = render_inside;
		this.foreground_layer = document.createElementNS("http://www.w3.org/2000/svg", "g");
		this.middle_layer = document.createElementNS("http://www.w3.org/2000/svg", "g");
		this.background_layer = document.createElementNS("http://www.w3.org/2000/svg", "g");
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

			} else {
				to_delete.splice(i, 1);
			}
		}
	}

	render_chunk(chunk: StarfieldChunk) {

	}
}
