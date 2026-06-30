import "./App.css";
import React from "react";
import Image from "next/image";

function Preloader() {
  return (
    <div className="preloader-game">
      <div className="prel-logo">
        <Image
          className="prel-logo-img"
          src="/images/frenzy/prel_logo.png"
          alt="Loading Logo"
          width={200}
          height={100}
        />
      </div>
      <div className="prel-bar">
        <div className="prel-bar-line">
          <Image
            className="prel-bar-line-img"
            src="/images/frenzy/prel_line.png"
            alt=""
            width={300}
            height={10}
          />
        </div>
        <div className="prel-bar-back">
          <Image
            className="prel-bar-back-img"
            src="/images/frenzy/prel_bar.png"
            alt=""
            width={300}
            height={10}
          />
        </div>
      </div>
      <div className="prel-bar-text">
        <span>
          Loading... <span id="percentage">10%</span>
        </span>
      </div>
    </div>
  );
}

export default Preloader;
