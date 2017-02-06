'use strict';

var materials = [
  "Hydrogen",
  "Helium",
  "Lithium",
  "Beryllium"
];

var materialsLength2 = materials.map((material) => {
	return material.length
});

document.addEventListener("DOMContentLoaded", function() {
	console.log('What a test... ', materialsLength2);
});
