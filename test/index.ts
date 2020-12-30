import * as lib from "../src/index";

console.log("YAYAYAYYAYAYAYAYA");

const windowx = window as any;
windowx.lib = lib;

//Woooo test
const starfield = new lib.GlapRsStarfield("test");
const svg = document.querySelector("svg");
const renderer = new lib.SvgRenderer(starfield, svg, 1000);
windowx.starfield = starfield;
windowx.renderer = renderer;

renderer.update_player_position(0,0);

function animate() {
	let x = 0;
	let y = 0;
	setInterval(function() {
		x += 0.5;
		y += 0.2;
		renderer.update_player_position(x, y);
	}, 1000/20);
}
windowx.animate = animate;


console.log("Reached EOF");
