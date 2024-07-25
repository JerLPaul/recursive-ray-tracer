# Javascript Ray Tracer

## Description
This is one of my old ray tracing projects that draws lighting, shadows and reflections with pure javascript. The program takes either a scene file with spheres, or a scene and an object file. The program will draw the scene and the corresponding objects stated in the scene file using a recursive rayu tracing approach. The project takes an scene file as well as an optional object file (.obj) and draws the images pixel by pixel. 

## Executing program
* Open the repo and host the server with the following command:
```
python3 -m http.server
```
* Visit http://localhost:8000/ to view the project.
* Click the "Choose Files" button and select a scene file with or without an object file.
View the drawn scene.

## Scene File Syntax
Here is an example of a file:
```
light    1 4 -4   0.8 0.8 0.8    0.9 0.9 0.9 
1
sphere   -3  2  -4  1.0     0.3 0.3 0.3      0.3 0.7 0.7   0.9 0.1 0.1    0
sphere   1.8 -1 -8.0    1.5     0.5 0.1 0.5     0.7 0.3 0.7   0.1 0.8 0.1    0.8

mesh    1 2 -8  1.57 1.57 2    1.0    0.8 0.2 0.2     0.9 0.3 0.3   0.8 0.8 0.8  0.9

```

The first line states the light location, followed by its ambient and specular values. Each additional line states the type of object followed by its coordinates, size, colour, its diffusion value, the specular value, and lastly its transparency.

## Limitations
This Ray tracer does not currently do antialiasing and proper transparency. They will be features added in the future. Additionally, the website only takes 1 object file alongside the scene file; multiple meshes will utilize the same object file when drawing.
