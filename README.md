# SeaRebbel

This project integrates Mapbox and Three.js in a React context in order to create a visual demo for the SeaRebbel project.

You can have a look at the result in the following [link](https://webglstudio.org/users/cdelcorral/searebbel/). The demo is finished, you can navigate through the map and double click on it to add pins, and click on one buoy to view its content. On top there is a navigation bar and by the side of the map you can find the 3D scene.

## Frontend

### Development

#### node_modules folder

In this repository you can find all the files needed to work on the project in a development stage. However, the folder `node_modules` is ignored due to its huge size; as they are all libraries, you can install them using `npm install` since all the dependencies are stated in the `package.json` file.

#### App Diagram

This whole work is done in a modular way. Each App component is an individual and independent element, as it has been developed using React. In the following image you can clearly see all the components that take part and how they interact with each other.

<img src="app diagram.png"
     alt="App Diagram"
     style="padding: 10px"/>

The map has been implemented in React using Mapbox GL JS, a map provider. And the 3D scene has been developed in React Three Fiber, a React renderer for Three.js. Each scene component has been separated into its own file and is structured in the following way:

<img src="scene diagram.png"
     alt="Scene Diagram"
     style="padding: 10px"/>

Currently, the app is hosted in a web server, but as it has been developed in a React environment, it is extensible and scalable and can be integrated in a mobile application in the future.

### Production

You can find the files needed for a production environment in the `build` folder, which can be deployed by uploading it into a server or create a static server `npm install -g serve serve -s build`.

## Backend

This project connects the server and client side using node and express. The UI shows a map with some data, which is stored in MongoDB Atlas, in order to retrieve it `mongoose` is used to help stablish the connection. Once the server was built, it has been deployed to [render](https://render.com/). You can also modify the server side in a development environment and run a local server.
