import route from "./Scene/config/Route.json";

export default function Logbook({
  record,
  setRecording,
  setWeather,
  setBoat,
  setData,
  setIsLogbookActive,
}) {
  var stream, mediaRecorder;
  var recordedBlobs = [];

  const handleStartRecording = () => {
    setIsLogbookActive("always");
    // get canvas
    var canvas =
      document.getElementById("canvas-recorder").lastChild.lastChild.lastChild;

    if (canvas !== undefined && canvas !== null) {
      stream = canvas.captureStream(50);
      const options = { mimeType: "video/webm" };
      const recorder = new MediaRecorder(stream, options);
      recorder.ondataavailable = handleDataAvailable;
      recorder.start();
      mediaRecorder = recorder;
    }
  };

  const handleStopRecording = () => {
    mediaRecorder.stop();
  };

  const handleDataAvailable = (event) => {
    if (event.data && event.data.size > 0) {
      recordedBlobs.push(event.data);
    }
  };

  const handleDownload = () => {
    const blob = new Blob(recordedBlobs, { type: "video/webm" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.style.display = "none";
    a.href = url;
    a.download = "recording.webm";
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 100);
  };

  if (record) {
    handleStartRecording(); // start recording

    // update state every 2 seconds for every waypoint of the route
    for (let i = 0; i < route.length; i++) {
      setTimeout(() => {
        setBoat((prev) => ({
          ...prev,
          longitude: route[i].longitude,
          latitude: route[i].latitude,
          next: {
            longitude: route[i + 1]
              ? route[i + 1].longitude
              : route[i].longitude + 0.01,
            latitude: route[i + 1]
              ? route[i + 1].latitude
              : route[i].latitude + 0.01,
          },
        }));
        setWeather(route[i].weather);
        setTimeout(() => {
          setData(route[i].data);
        }, 1000); // add 2d image to video
      }, 2000 * i);
    }

    // stop recording
    setTimeout(() => {
      handleStopRecording();
      setIsLogbookActive("never");
    }, 2000 * (route.length + 1));

    // download it
    setTimeout(() => {
      handleDownload();
    }, 2000 * (route.length + 2));

    setRecording(false);
  }

  return;
}
