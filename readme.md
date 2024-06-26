
# Basic Ray Tracer
This is one of my old ray tracing projects that takes a custom scene file and an optional object file draws the content using ray tracing for lighting, shadows and reflections. The program takes either a scene file with spheres, or a scene and object file where the scene file contains a mesh. The program will draw the scene using ray tracing.

`loaddata.js` holds all written functions for the project. Here is a small overview of the major functions:

- `draw_scene()`: main function that draws each pixel onto the canvas
- `parse()`: parses the input files
- `trace_sphere()`: determines an intersection of a sphere using ray tracing
- `trace_mesh()`: determines an intersection of a mesh using the Moller-Trumbore algorithm
- `get_illumination()`: determines the illuminate of a point of intersection

# Dependencies
- Python 3.9.7
- WebGL extensions
- Chrome 121.0.6167.86+

# Executing program

- Open the repo and host the server with the following command:
    - `python3 -m http.server`
- Visit http://localhost:8000/ to view the project.
- Click the "Choose Files" button and select a scene file with or without an object file.
- View the drawn scene.


# Limitations

- The geometry only works if the face lines given in the .obj file are at the end of the file.
