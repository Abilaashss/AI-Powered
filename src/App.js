import React, { useState, useEffect, useRef } from 'react';
import { Button } from 'react-bootstrap';
import { Howl } from 'howler';
import * as tf from '@tensorflow/tfjs';
import Webcam from 'react-webcam';
import clockMp3 from '../src/media/clock.mp3';
import bellMp3 from '../src/media/bell.mp3';
import './App.css';
import * as cocossd from '@tensorflow-models/coco-ssd';

const clockLoop = new Howl({
  src: [clockMp3],
  loop: true,
});

const bellSfx = new Howl({
  src: [bellMp3],
});

const PersonDetector = ({ handlePersonDetected, handlePersonLeft, isWorkInterval }) => {
  const webcamRef = useRef(null);
  const [model, setModel] = useState(null);

  useEffect(() => {
    const loadModel = async () => {
      const model = await cocossd.load();
      setModel(model);
    };
    loadModel();
  }, []);

  useEffect(() => {
    let intervalId = null;

    const detectPerson = async () => {
      if (isWorkInterval && model && webcamRef.current && webcamRef.current.video.readyState === 4) {
        const detections = await model.detect(webcamRef.current.video);
        const personDetections = detections.filter((detection) => detection.class === 'person');
        if (personDetections.length > 0) {
          handlePersonDetected();
        } else {
          handlePersonLeft();
        }
      }
    };

    const startDetection = () => {
      intervalId = setInterval(detectPerson, 500); // Adjust this value to change the detection frequency
    };

    const stopDetection = () => {
      clearInterval(intervalId);
    };

    if (isWorkInterval) {
      startDetection();
    } else {
      stopDetection();
    }

    return stopDetection;
  }, [model, handlePersonDetected, handlePersonLeft, isWorkInterval]);

  return <Webcam ref={webcamRef} />;
};

function App() {
  const [isRunning, setIsRunning] = useState(false);
  const [timeMin, setTimeMin] = useState(25);
  const [timeSec, setTimeSec] = useState(0);
  const [onBreak, setOnBreak] = useState(false);
  const [workInterval, setWorkInterval] = useState(0);
  const [breakInterval, setBreakInterval] = useState(0);
  const [bgColor, setBgColor] = useState('#333');
  const [progressWork, setProgressWork] = useState(0);
  const [progressBreak, setProgressBreak] = useState(0);

  useEffect(() => {
    let intervalPom;
    if (isRunning) {
      intervalPom = setInterval(() => {
        if (timeSec > 0) {
          setTimeSec(timeSec => timeSec - 1);
        }
        if (timeSec === 0) {
          if (timeMin === 0) {
            clearInterval(intervalPom);
            bellSfx.play();
            if (!onBreak) {
              setWorkInterval(workInterval + 1);
              setProgressWork(workInterval + 1);
              setBgColor('#2196f3'); // Blue color during break
              setTimeMin(5);
              setTimeSec(0);
              setOnBreak(true);
            } else {
              setBreakInterval(breakInterval + 1);
              setProgressBreak(breakInterval + 1);
              setBgColor('#333'); // Black color during work interval
              setTimeMin(25);
              setTimeSec(0);
              setOnBreak(false);
            }
          } else {
            setTimeMin(timeMin => timeMin - 1);
            setTimeSec(59);
          }
        }
      }, 1000);
    } else {
      clearInterval(intervalPom);
    }

    return () => clearInterval(intervalPom);
  }, [isRunning, timeMin, timeSec, onBreak, workInterval, breakInterval]);

  useEffect(() => {
    if (isRunning && !onBreak) {
      clockLoop.play();
    } else {
      clockLoop.stop();
    }
  }, [isRunning, onBreak]);

  const handlePersonDetected = () => {
    setIsRunning(true);
  };

  const handlePersonLeft = () => {
    if (!onBreak) {
      setIsRunning(false);
      setTimeMin(25);
      setTimeSec(0);
      setBgColor('#333');
    }
  };

  const pauseTimer = () => {
    setIsRunning(false);
  };

  const resetTimer = () => {
    setIsRunning(false);
    setTimeMin(25);
    setTimeSec(0);
    setWorkInterval(0);
    setBreakInterval(0);
    setProgressWork(0);
    setProgressBreak(0);
    setBgColor('#333'); // Reset background color to black
  };

  const reduceTime = () => {
    if (timeMin > 0) {
      setTimeMin(timeMin => timeMin - 1);
    }
  };

  const increaseTime = () => {
    if (timeMin < 100) {
      setTimeMin(timeMin => timeMin + 1);
    }
  };

  return (
    <div className="app-container" style={{ backgroundColor: bgColor }}>
      <PersonDetector
        handlePersonDetected={handlePersonDetected}
        handlePersonLeft={handlePersonLeft}
        isWorkInterval={!onBreak}
      />
      <div className="container">
        <div className="title-container">
          <h1 className="timer-heading">Pomodoro Timer</h1>
        </div>
        <div className="timer-container">
          <div className="timer-display">
            {timeMin}:{timeSec < 10 ? `0${timeSec}` : timeSec}
          </div>
          <div className="time-controls">
            <Button variant="outline-danger" size="lg" onClick={reduceTime}>
              -
            </Button>
            <Button variant="outline-success" size="lg" onClick={increaseTime}>
              +
            </Button>
          </div>
          <div className="progress-container">
            <div className="progress-bar">
              <div
                className="work-progress"
                style={{ width: `calc((100% / 25) * ${progressWork})` }}
              ></div>
              <div
                className="break-progress"
                style={{ width: `calc((100% / 5) * ${progressBreak})` }}
              ></div>
            </div>
          </div>
          <div className="interval-count">
            <span role="img" aria-label="work-interval">
              📖
            </span>

            {workInterval}/
            <span role="img" aria-label="break-interval">
              🍻
            </span>
            {breakInterval}
          </div>
        </div>
        <div className="button-container">
          <Button variant="outline-success" size="lg" disabled>
            Start
          </Button>
          {isRunning ? (
            <Button variant="outline-danger" size="lg" onClick={pauseTimer}>
              Pause
            </Button>
          ) : null}
          <Button variant="outline-dark" size="lg" onClick={resetTimer} disabled={isRunning}>
            Reset
          </Button>
        </div>
      </div>
    </div>
  );
}

export default App;