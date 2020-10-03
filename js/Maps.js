"use strict";

// Tell WorldWind to log only warnings and errors.
WorldWind.Logger.setLoggingLevel(WorldWind.Logger.LEVEL_ERROE);

// Create the WorldWindow.
var wwd = new WorldWind.WorldWindow("canvasOne");
wwd.navigator.lookAtLocation.latitude = 38;
wwd.navigator.lookAtLocation.longitude = 140;
wwd.navigator.range = 120000;

// Create and add layers to the WorldWindow.
var layers = [
    // Imagery layers.
    {layer: new WorldWind.BMNGLayer(), enabled: true},
    {layer: new WorldWind.BMNGLandsatLayer(), enabled: true},
    {layer: new WorldWind.BingAerialLayer(null), enabled: false},
    {layer: new WorldWind.BingAerialWithLabelsLayer(null), enabled: false},
    {layer: new WorldWind.BingRoadsLayer(null), enabled: false},
    {layer: new WorldWind.OpenStreetMapImageLayer(null), enabled: false},
    // Add atmosphere layer on top of all base layers.
    {layer: new WorldWind.AtmosphereLayer(), enabled: true},
    // WorldWindow UI layers.
    {layer: new WorldWind.CompassLayer(), enabled: false},
    {layer: new WorldWind.CoordinatesDisplayLayer(wwd), enabled: true},
    {layer: new WorldWind.ViewControlsLayer(wwd), enabled: false}
];

for (var l = 0; l < layers.length; l++) {
    layers[l].layer.enabled = layers[l].enabled;
    wwd.addLayer(layers[l].layer);
}

// Create a layer manager for controlling layer visibility.
//var layerManager = new LayerManager(wwd);
