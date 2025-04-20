document.addEventListener("DOMContentLoaded", () => {
    console.log("EcoGuessr is ready!");
  
    const main = document.querySelector("main");
  
    const message = document.createElement("p");
    message.textContent = "Welcome to EcoGuessr! Let's start raising awareness.";
  
    main.appendChild(message);
  });
  