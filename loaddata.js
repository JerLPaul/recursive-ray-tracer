// flag indicating that data has been loaded
let loaded = false;

// global geometry arrays
let vertices = [];
let indices = [];
let normals = [];
let vertexCount = 0;

// scene information
let light = {};
let spheres = [];
let numSpheres = 0;
let meshes = [];
let isDrawn = false; // switch with loaded
let box = {
	min_x: Infinity,
	max_x: -Infinity,
	min_y: Infinity,
	max_y: -Infinity,
	min_z: Infinity,
	max_z: -Infinity
}

let total_pixels = 0
let reflections = 0

	// parser for scene and obj file fills arrays
function parse(scene, obj) {
	if (scene) {
		scene.split("\n").forEach((line) => {
			// seperate into tokens and remove empty strings
			let tokens = line.split(" ").filter((token) => token);
	
			// parse the line
			if (tokens[0] === "light") {
				light = {
					x: parseFloat(tokens[1]),
					y: parseFloat(tokens[2]),
					z: parseFloat(tokens[3]),
					ar: parseFloat(tokens[4]),
					ag: parseFloat(tokens[5]),
					ab: parseFloat(tokens[6]),
					pr: parseFloat(tokens[7]),
					pg: parseFloat(tokens[8]),
					pb: parseFloat(tokens[9])
				};
			} 
			else if (tokens[0] === "sphere") {
				spheres.push({
					x: parseFloat(tokens[1]),
					y: parseFloat(tokens[2]),
					z: parseFloat(tokens[3]),
					r: parseFloat(tokens[4]),
					ar: parseFloat(tokens[5]),
					ag: parseFloat(tokens[6]),
					ab: parseFloat(tokens[7]),
					dr: parseFloat(tokens[8]),
					dg: parseFloat(tokens[9]),
					db: parseFloat(tokens[10]),
					sr: parseFloat(tokens[11]),
					sg: parseFloat(tokens[12]),
					sb: parseFloat(tokens[13]),
					shine: parseFloat(tokens[14])
				});
			}
			else if (tokens[0] === "mesh") {
				// load mesh
				meshes.push({
					tx: parseFloat(tokens[1]),
					ty: parseFloat(tokens[2]),
					tz: parseFloat(tokens[3]),
					rotx: parseFloat(tokens[4]),
					roty: parseFloat(tokens[5]),
					rotz: parseFloat(tokens[6]),
					s: parseFloat(tokens[7]),
					ar: parseFloat(tokens[8]),
					ag: parseFloat(tokens[9]),
					ab: parseFloat(tokens[10]),
					dr: parseFloat(tokens[11]),
					dg: parseFloat(tokens[12]),
					db: parseFloat(tokens[13]),
					sr: parseFloat(tokens[14]),
					sg: parseFloat(tokens[15]),
					sb: parseFloat(tokens[16]),
					shine: parseFloat(tokens[17]),
				});
			}
			else if (!isNaN(tokens[0])) {
				numSpheres = parseInt(tokens[0]);
			}
	
			
	
		});
	}

	if (obj) {
		// read obj file
		let tempVertices = [];
		let tempNormals = [];
		let tempTextureCoords = [];

		obj.split("\n").forEach( function(line) {
			// seperate into tokens and remove empty strings
			line = line.split(" ").filter(e => e);
			if (line[0] === "v") {
				//add vertice 
				tempVertices.push([parseFloat(line[1]), parseFloat(line[2]), parseFloat(line[3])]);
			}
			else if (line[0] === "f") {
				line = line.slice(1);

				// reorder the vertices, textures and normals in the same order as the indices
				line.forEach(function(line) {
					line = line.split("/");
					let indice = parseInt(line[0]) - 1;

					// push the vertice and indice
					vertices.push(tempVertices[indice]);
					indices.push(vertices.length - 1);
				});
			}
		});
	}
}

	// determines the intersection of a ray with a sphere
function trace_sphere(origin, sphere, dir, is_shadow) {
	let A = 1
	let B = 2 * ( dir.x * (origin.x - sphere.x)  + dir.y * (origin.y - sphere.y)  +  dir.z * (origin.z - sphere.z) )

	let C = (origin.x - sphere.x) * (origin.x - sphere.x) + (origin.y - sphere.y) * (origin.y - sphere.y) + (origin.z - sphere.z) * (origin.z - sphere.z) - sphere.r * sphere.r

	let d = B * B - 4 * A * C

	if (d < 0) {
		return null;
	}

	let p1 = null;
	let p2 = null;
	// if 2 intersections
	if (d > 0) {
		let d2 =( -B + Math.sqrt(d)) / (2 * A)
		if (d2 > 0 || is_shadow) {
			p2 = {
				x: origin.x + dir.x * d2,
				y: origin.y + dir.y * d2,
				z: origin.z + dir.z * d2 
			}
		}
	}
	// if 1 intersection
	if (d >= 0) {
		let d1 = (-B - Math.sqrt(d)) / (2 * A)

		if (d1 > 0 || is_shadow) {
			p1 = {
				x: origin.x + dir.x * d1,
				y: origin.y + dir.y * d1,
				z: origin.z + dir.z * d1 
			}
		}
	}

	// find intersection with shortest distance
	if (p1 && p2) {	
		if (get_distance(p2, origin) < get_distance(p1, origin)) {
			p1 = p2
		}
	}

	return p1;
}

	// determines the intersection of a ray with a mesh using the Moller-Trumbore algorithm
function trace_mesh(origin, dir) {
	// check if the ray intersects the bounding box
	if (!in_bounding_box(origin, dir)) {
		return null;
	}

	for (let i=0; i<indices.length; i+=3) {
		let p1 = {
			x: vertices[indices[i]][0],
			y: vertices[indices[i]][1],
			z: vertices[indices[i]][2]
		};
		let p2 = {
			x: vertices[indices[i+1]][0],
			y: vertices[indices[i+1]][1],
			z: vertices[indices[i+1]][2]
		};
		let p3 = {
			x: vertices[indices[i+2]][0],
			y: vertices[indices[i+2]][1],
			z: vertices[indices[i+2]][2]
		};

		let e1 = {
			x: p2.x - p1.x,
			y: p2.y - p1.y,
			z: p2.z - p1.z
		};
		let e2 = {
			x: p3.x - p1.x,
			y: p3.y - p1.y,
			z: p3.z - p1.z
		};

		let normal = cross_product(e1, e2);
        if (dot_product(normal, dir) > 0) {
            continue;
        }

		let h = cross_product(dir, e2);
		let a = dot_product(e1, h);

		if (a > -0.0001 && a < 0.0001) {
			continue;
		}

		let f = 1 / a;
		let s = {
			x: origin.x - p1.x,
			y: origin.y - p1.y,
			z: origin.z - p1.z
		};
		let u = f * dot_product(s, h);

		if (u < 0 || u > 1) {
			continue;
		}

		let q = cross_product(s, e1);
		let v = f * dot_product(dir, q);

		if (v < 0 || u + v > 1) {
			continue;
		}

		let t = f * dot_product(e2, q);

		if (t > 0.0001) {
			return [ {
				x: origin.x + dir.x * t,
				y: origin.y + dir.y * t,
				z: origin.z + dir.z * t
			}, indices[i]/3];

		}
	}

	return null;
}

function in_bounding_box(origin, dir) {
    let xt_min = (box.min_x - origin.x) / dir.x;
    let xt_max = (box.max_x - origin.x) / dir.x;

    if (xt_min > xt_max) {
        [xt_min, xt_max] = [xt_max, xt_min];
    }

    let yt_min = (box.min_y - origin.y) / dir.y;
    let yt_max = (box.max_y - origin.y) / dir.y;

    if (yt_min > yt_max) {
        [yt_min, yt_max] = [yt_max, yt_min];
    }

    let zt_min = (box.min_z - origin.z) / dir.z;
    let zt_max = (box.max_z - origin.z) / dir.z;

    if (zt_min > zt_max) {
        [zt_min, zt_max] = [zt_max, zt_min];
    }

    let tmin = Math.max(xt_min, yt_min, zt_min);
    let tmax = Math.min(xt_max, yt_max, zt_max);

    if (tmin > tmax) {
        return false;
    }

    return true;
}	

	// get the illumination of a pixel given the intersection point
function get_illumination(origin, p, mesh, sphere, normal) {
	
	let ambient = [0, 0, 0]
	if (mesh) {
		ambient = [light.ar * mesh.ar, light.ag * mesh.ag, light.ab * mesh.ab]
	}
	else if (sphere) {
		ambient = [light.ar * sphere.ar, light.ag * sphere.ag, light.ab * sphere.ab]
	}

	if (in_shadow(p, mesh, sphere)) {
		ambient = ambient.map(c => Math.floor(Math.min(255, Math.max(0, c * 255))))
		return ambient;
	}

	// calculate view vector
	let view_vector = {
		x: origin.x - p.x,
		y: origin.y - p.y,
		z: origin.z - p.z
	}
	view_vector = normalize(view_vector)

	// calculate light vector
	let light_vector = {
		x: light.x - p.x,
		y: light.y - p.y,
		z: light.z - p.z
	}
	light_vector = normalize(light_vector)

	const light_dot_normal = dot_product(light_vector, normal)

	// calculate reflection vector
	let reflection = {
		x: 2 * light_dot_normal * normal.x - light_vector.x,
		y: 2 * light_dot_normal * normal.y - light_vector.y,
		z: 2 * light_dot_normal * normal.z - light_vector.z
	}
	reflection = normalize(reflection)

	const reflection_dot_view = Math.max(0, dot_product(reflection, view_vector))

	// illumination equation

	let diffuse = [0, 0, 0]
	let specular = [0, 0, 0]
	if (sphere) {
		ambient = [light.ar * sphere.ar, light.ag * sphere.ag, light.ab * sphere.ab]
		diffuse = [light.pr * sphere.dr, light.pg * sphere.dg, light.pb * sphere.db].map(v => v * light_dot_normal)
		specular = [light.pr * sphere.sr, light.pg * sphere.sg, light.pb * sphere.sb].map(v => v * Math.pow(reflection_dot_view, sphere.shine * 190 + 10))
	}
	else if (mesh){
		// Mesh illumination
		ambient = [light.ar * mesh.ar, light.ag * mesh.ag, light.ab * mesh.ab]
		diffuse = [light.pr * mesh.dr, light.pg * mesh.dg, light.pb * mesh.db].map(v => v * light_dot_normal)
		specular = [light.pr * mesh.sr, light.pg * mesh.sg, light.pb * mesh.sb].map(v => v * Math.pow(reflection_dot_view, mesh.shine * 190 + 10))
	}

	const illumination = [ambient[0] + diffuse[0] + specular[0], ambient[1] + diffuse[1] + specular[1], ambient[2] + diffuse[2] + specular[2]]
	illumination[0] = Math.floor(Math.min(255, Math.max(0, illumination[0] * 255)))
	illumination[1] = Math.floor(Math.min(255, Math.max(0, illumination[1] * 255)))
	illumination[2] = Math.floor(Math.min(255, Math.max(0, illumination[2] * 255)))


	return illumination;
}

// Determines if there is a shadow at intersection point p
function in_shadow(p) {
	let shadow_dir = {
		x: light.x - p.x,
		y: light.y - p.y,
		z: light.z - p.z
	}
	normalize(shadow_dir)

	let shadow = get_intersection(p, shadow_dir, true)

	if (shadow && get_distance(shadow.point, p) > 0.0001) {
		return true;
	}

	return false;
}

// main function to draw the scene
function draw_scene(scene, obj) {	

	// do ray tracing

	const canvas = document.querySelector('.myCanvas');

    // set size of 2D image

	if (!loaded) {
		canvas.width = canvas.clientWidth
		canvas.height = canvas.clientHeight
	}

    const width = canvas.width;
    const height = canvas.height;

	console.log(width, height);

    const ctx = canvas.getContext('2d');

	if (loaded) {
		ctx.fillStyle = 'rgb(0, 0, 0)';
		ctx.clearRect(0, 0, width, height);
		light = {};
		spheres = [];
		meshes = [];
		vertices = [];
		indices = [];
		normals = [];


		console.log("cleared");
	}

	parse(scene, obj);

	transform_meshes();

    // set background to black
	ctx.fillStyle = 'rgb(0, 0, 0)';
	ctx.fillRect(0, 0, width, height);			

	const origin = {
		x: 0,
		y: 0,
		z: 0
	}

	const aspect_ratio = width / height;

	// draw the scene
	for (let i=0; i<height; i++) {

		for (let j=0; j<width; j++) {

			const dir = {
				x: (2 * ((j + 0.5) / width) - 1) * aspect_ratio * Math.tan(60 * Math.PI / 180),
				y: (1 - 2 * ((i + 0.5) / height)) * Math.tan(60 * Math.PI / 180),
				z: -1
			}
			normalize(dir);

			let pixel = recursive_trace(origin, dir, 5);

			if (pixel) {
				// draw the pixel
				ctx.fillStyle = `rgb(
					${pixel[0]},
					${pixel[1]},
					${pixel[2]}
				)`
				// draw 1x1 point using the selected colour
				ctx.fillRect(j, i, 1, 1);
			}
		}
	}

	console.log("done drawing");
	console.log("total pixels: ", total_pixels);
	console.log("reflections: ", reflections);

}

// recursive function to trace the ray
function recursive_trace(origin, dir, depth) {
	if (depth === 0) {
		return null;
	}

	let object = get_intersection(origin, dir, false);

	if (object) {
		total_pixels++;
		if (object.mesh) {
			// gets the base pixel illumination
			let illumination = get_illumination(origin, object.point, object.mesh, null, object.normal);

			// adds the reflection component if the object has a shine
			if (object.mesh.shine > 0) {
				// calculate light vector
				let light_vector = {
					x: light.x - object.point.x,
					y: light.y - object.point.y,
					z: light.z - object.point.z
				}
				normalize(light_vector)
				const light_dot_normal = dot_product(light_vector, object.normal)
				// calculate reflection vector
				let new_dir = {
					x: 2 * light_dot_normal * object.normal.x - light_vector.x,
					y: 2 * light_dot_normal * object.normal.y - light_vector.y,
					z: 2 * light_dot_normal * object.normal.z - light_vector.z
				}
				new_dir = normalize(new_dir)
				let reflection = recursive_trace(object.point, new_dir, depth - 1)

				if (!reflection) {
					return illumination;
				}
				if (reflection[0] > 0 || reflection[1] > 0 || reflection[2] > 0) {
					reflections++;
				}

				const reflectivity = object.mesh.shine;

				let new_illumination = [
					(1 - reflectivity) * illumination[0] + reflectivity * reflection[0],
					(1 - reflectivity) * illumination[1] + reflectivity * reflection[1],
					(1 - reflectivity) * illumination[2] + reflectivity * reflection[2]
				];
				return new_illumination;
			}
			return illumination;
		}
		else if (object.sphere) {
			let illumination = get_illumination(origin, object.point, null, object.sphere, object.normal);
			if (object.sphere.shine > 0) {
				// calculate light vector
				let light_vector = {
					x: light.x - object.point.x,
					y: light.y - object.point.y,
					z: light.z - object.point.z
				}
				light_vector = normalize(light_vector)

				const light_dot_normal = dot_product(light_vector, object.normal)
				

				// calculate reflection vector
				let new_dir = {
					x: 2 * light_dot_normal * object.normal.x - light_vector.x,
					y: 2 * light_dot_normal * object.normal.y - light_vector.y,
					z: 2 * light_dot_normal * object.normal.z - light_vector.z
				}
				new_dir = normalize(new_dir)

				let reflection = recursive_trace(object.point, new_dir, depth - 1)

				if (!reflection) {
					return illumination;
				}

				if (reflection[0] > 0 || reflection[1] > 0 || reflection[2] > 0) {
					reflections++;
				}

				const reflectivity = object.sphere.shine;

				let new_illumination = [
					(1 - reflectivity) * illumination[0] + reflectivity * reflection[0],
					(1 - reflectivity) * illumination[1] + reflectivity * reflection[1],
					(1 - reflectivity) * illumination[2] + reflectivity * reflection[2]
				];
				
				return new_illumination;
			}
			return illumination;
		}
		
	}
	return null;
}

// get the intersection point of the ray with the scene
// is_shadow is a flag to determine if the intersection is for shadow calculation
function get_intersection(origin, dir, is_shadow) {
	let p = null
	let s = null
	let m = null
	let normal_index = null

	// calculate the intersection with the sphere
	spheres.forEach((sphere) => {
		let p1 = trace_sphere(origin, sphere, dir, is_shadow);
		if (p1) {
            const distance = get_distance(p1, origin);
            if (distance > 0.0001) { 
                if (!p || distance < get_distance(p, origin)) {
                    p = p1;
                    s = sphere;
                }
            }
        }
	});

	// calculate the intersection with the mesh
	meshes.forEach((mesh) => {
		let p1 = trace_mesh(origin, dir);

		if (p1) {
            const distance = get_distance(p1[0], origin);
            if (distance > 0.0001) { 
                if (!p || distance < get_distance(p, origin)) {
                    p = p1[0];
                    normal_index = p1[1];
                    m = mesh;
                    s = null;
                }
            }
        }
	});

	// get the pixel illumination if there is an intersection
	if (p) {
		let normal = null
		if (m) {
			normal = {
				x: normals[normal_index][0],
				y: normals[normal_index][1],
				z: normals[normal_index][2]
			}
		}
		else {
			normal = {
				x: (p.x - s.x) / s.r,
				y: (p.y - s.y) / s.r,
				z: (p.z - s.z) / s.r
			}
		}
		normalize(normal)

		return {
			point: p,
			mesh: m,
			sphere: s,
			normal: normal
		}
	}
	return null
}



function cross_product(a, b) {
	if (Array.isArray(a)) {
		return [
			a[1] * b[2] - a[2] * b[1],  
			a[2] * b[0] - a[0] * b[2],  
			a[0] * b[1] - a[1] * b[0]  
		];
	}
	else {
		return {
			x: a.y * b.z - a.z * b.y,
			y: a.z * b.x - a.x * b.z,
			z: a.x * b.y - a.y * b.x
		};
	}
}

function dot_product(a, b) {
	if (Array.isArray(a)) {
		return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
	}
	else {
		return a.x * b.x + a.y * b.y + a.z * b.z;
	}
}

function normalize(vector) {
	if (Array.isArray(vector)) {
		if (vector[0] === 0 && vector[1] === 0 && vector[2] === 0) {
			return vector;
		}
		let mag = Math.sqrt(vector[0] * vector[0] + vector[1] * vector[1] + vector[2] * vector[2]);

		vector[0] /= mag;
		vector[1] /= mag;
		vector[2] /= mag;

		return vector;
	}
	else {
		if (vector.x === 0 && vector.y === 0 && vector.z === 0) {
			return vector;
		}

		let mag = Math.sqrt(vector.x * vector.x + vector.y * vector.y + vector.z * vector.z);

		vector.x /= mag;
		vector.y /= mag;
		vector.z /= mag;

		return vector;
	}
	
}

function get_distance(p1, p2) {
	return Math.sqrt((p2.x - p1.x) * (p2.x - p1.x) + (p2.y - p1.y) * (p2.y - p1.y) + (p2.z - p1.z) * (p2.z - p1.z));
}

// code from A2 to get the normals if not given by the obj file
function update_mesh() {
	// get the normal for each triangle and sums them
	for (let i=2; i<indices.length; i+=3) {
		let tri = [i-2, i-1, i];
		let p1 = {
			x: vertices[tri[0]][0],
			y: vertices[tri[0]][1],
			z: vertices[tri[0]][2]
		};
		let p2 = {
			x: vertices[tri[1]][0],
			y: vertices[tri[1]][1],
			z: vertices[tri[1]][2]
		};
		let p3 = {
			x: vertices[tri[2]][0],
			y: vertices[tri[2]][1],
			z: vertices[tri[2]][2]
		};

		push_normal(p1, p2, p3);
		update_bounding_box(p1, p2, p3);

	}

	// sort the vertices, indices and normals by z value
	let temp = [];
	for (let i = 0; i < vertices.length; i += 3) {
		let faceVertices = [vertices[i], vertices[i + 1], vertices[i + 2]];
		let faceNormal = normals[i / 3]; // One normal per face
		let avgZ = (faceVertices[0][2] + faceVertices[1][2] + faceVertices[2][2]) / 3;
		temp.push({vertices: faceVertices, normal: faceNormal, avgZ: avgZ});
	}
	
	temp.sort((a, b) => b.avgZ - a.avgZ);
	
	vertices = [];
	normals = [];
	for (let i = 0; i < temp.length; i++) {
		vertices.push(...temp[i].vertices);
		normals.push(temp[i].normal); // One normal per face
	}

}

function push_normal(p1, p2, p3) {
	let a = [p2.x - p1.x, p2.y - p1.y, p2.z - p1.z];
	let b = [p3.x - p1.x, p3.y - p1.y, p3.z - p1.z];

	let normal = normalize(cross_product(a, b));

	normals.push(normal);
}

function update_bounding_box(p1, p2, p3) {
	box.min_x = Math.min(box.min_x, p1.x, p2.x, p3.x);
	box.max_x = Math.max(box.max_x, p1.x, p2.x, p3.x);
	box.min_y = Math.min(box.min_y, p1.y, p2.y, p3.y);
	box.max_y = Math.max(box.max_y, p1.y, p2.y, p3.y);
	box.min_z = Math.min(box.min_z, p1.z, p2.z, p3.z);
	box.max_z = Math.max(box.max_z, p1.z, p2.z, p3.z);
}

function transform_meshes() {
	// rotate, translate and scale the mesh
	meshes.forEach((mesh) => {
		let transform_matrix = mat4.create();

		// translate
		const translate_matrix = mat4.create();
		mat4.translate(translate_matrix, translate_matrix, [mesh.tx, mesh.ty, mesh.tz]);

		// scale
		const scale_matrix = mat4.create();
		mat4.scale(scale_matrix, scale_matrix, [mesh.s, mesh.s, mesh.s]);

		// rotate
		const rotate_matrix = mat4.create();
		mat4.rotateX(rotate_matrix, rotate_matrix, mesh.rotx, [0, 0, 0]);
		mat4.rotateY(rotate_matrix, rotate_matrix, mesh.roty, [0, 0, 0]);
		mat4.rotateZ(rotate_matrix, rotate_matrix, mesh.rotz, [0, 0, 0]);

		mat4.multiply(transform_matrix, transform_matrix, translate_matrix);
		mat4.multiply(transform_matrix, transform_matrix, rotate_matrix);
		mat4.multiply(transform_matrix, transform_matrix, scale_matrix);

		for (let i=0; i<vertices.length; i++) {
			// apply transformations to each vertex
			let result = vec4.fromValues(vertices[i][0], vertices[i][1], vertices[i][2], 1);
			vec4.transformMat4(result, result, transform_matrix);
			vertices[i] = [result[0], result[1], result[2]];
		}
		
	});
	normals = [];
	update_mesh();
}

