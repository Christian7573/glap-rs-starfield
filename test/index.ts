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


console.log("Reached EOF");
