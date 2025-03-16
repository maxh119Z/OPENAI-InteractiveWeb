  import express from "express";
  import { readFileSync, writeFileSync, existsSync } from "fs";
  import fs from "fs";
  import { fileURLToPath } from "url";
  import { dirname } from "path";
  import OpenAI from "openai";

  import path from "path";
  const port = "3000";
  const app = express();
  const mySecret = process.env["OPENAI_API_KEY"];
  
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = dirname(__filename);
  const dataFilePath = path.join(__dirname, "data.json");
  const jsonData = readJSONFile(dataFilePath);
  var additionalcomments = "";
  var gametype = "";
  const clients = []; // This array will store all connected clients for SSE
  var pending = false;
  //type CurrentUser = User | null;
  
  // Server-Sent Events endpoint
  app.get("/stream-updates", (req, res) => {
    // Set headers for SSE connection
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
  
    // Add client to the list
    clients.push(res);
  
    // Remove client when they disconnect
    req.on("close", () => {
      clients.splice(clients.indexOf(res), 1);
    });
  });
  
  // Function to send reload message to all connected clients
  function reloadClients() {
    clients.forEach((client) => {
      client.write("data: reload\n\n"); // Send "reload" message to trigger page reload
    });
  }
  function messageClients(message) {
  
    clients.forEach((client) => {
      
      client.write(`data: ${message}\n\n`); // Send "reload" message to trigger page reload
    });
  }
  app.use(express.json()); // This middleware is required to parse JSON bodies in POST requests
  
  app.post("/confirm-and-run", (req, res) => {
    const gametype = req.body.data;
    if (!pending) {
      pending = !pending;
      updates(gametype);
    } else {
      messageClients("UPDATE ALREADY PENDING");
    }
  
    // Call the function to handle the update
    // Trigger page reload on all clients
    res.sendStatus(200); // Send a success status
  });
  
  app.post("/revert", (req, res) => {
    const gametype = req.body.data;
    if (!pending) {
      console.log(gametype)
      revertjson(gametype); // Call the function to handle revert
   // Trigger page reload on all clients
    } else {
      messageClients("UPDATE ALREADY PENDING");
    }
    res.sendStatus(200); // Send a success status
  });
  app.post("/submit-comments", (req, res) => {
    if (!pending) {
  
      additionalcomments = req.body.additionalcomments;
      gametype = req.body.gametype;
      console.log("Received additional comments:", additionalcomments);
      const allData = {
        gametype: gametype,
        suggestions: additionalcomments,
      };
      // Add the new data
      addData(allData, "errors.json");
    } else {
      messageClients("UPDATE ALREADY PENDING");
      //replace with something something else so it doe
    }
  
    res.sendStatus(200); // Respond with a success status
  });
  app.post("/skibidi", (req, res) => {
    console.log(req.body);
    messageClients(JSON.stringify(req.body));
    res.sendStatus(200);
  });
  
  // Your main GET route to serve the HTML page
  app.get("/*", (req, res) => {
  
    const pageHeader = req.url || "home"; // Extract header from query parameter, fallback to "default"
    const decodedPageHeader = decodeURIComponent(pageHeader);
  
    const sanitizedPageHeader = decodedPageHeader.replace(/[^a-z0-9_\- ]/gi, '_').trim().substring(1);
    console.log(sanitizedPageHeader)
    var dataFilePath = path.join(__dirname, `${sanitizedPageHeader}.json`); // Dynamically set the file path
  
    // Reading JSON data from file
    if (!fs.existsSync(dataFilePath)) {
      console.log(`${dataFilePath} does not exist. Falling back to "home".`);
      dataFilePath = path.join(__dirname, `home.json`);
    }
    const jsonData = readJSONFile(dataFilePath);
  
    let title = "";
    let htmlcode = "";
    let csscode = "";
    let jscode = "";
    let mpcode = "";
  
    if (jsonData.length > 0) {
      let revert = 1;
      do {
        const lastEntry = jsonData[jsonData.length - revert];
        title = lastEntry.title || "";
        htmlcode = lastEntry.html || "";
        csscode = lastEntry.css || "";
        jscode = lastEntry.javascript || "";
        mpcode = lastEntry.multiplayer || "";
        revert++;
      } while (
        (htmlcode === "" ||
          csscode === "" ||
          htmlcode.includes("rest of code") ||
          csscode.includes("rest of code") ||
          jscode.includes("rest of code")) &&
        revert <= jsonData.length
      );
    }
  
    var downloadedhtml = htmlcode.replace(/<\/script>/g, "<\\/script>");
  
    res.send(`
      <!DOCTYPE html>
      <html lang="en">
      <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>${title || "Content Updater"}</title>
          <style>
              ${csscode}
               /* Global Styles */
          * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
              font-family: 'Roboto', sans-serif;
          }
  
          body {
              background: linear-gradient(to bottom right, #1a2a6c, #b21f1f, #fdbb2d);
              color: #fff;
              line-height: 1.6;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: flex-start;
              min-height: 100vh;
          }
  
          /* Header */
          #siteheader {
              font-size: 2rem;
              font-weight: bold;
              text-align: center;
              height:75px;
              background: rgba(0, 0, 0, 0.7);
              color: white;
              display: flex;
              align-items: center;
              justify-content: space-between;
              padding: 20px;
              width: 100%;
              box-shadow: 0 4px 10px rgba(0, 0, 0, 0.4);
              transition: background 0.3s ease, height 0.3s ease;
              position: sticky;
              top: 0;
              z-index: 1000;
          }
          #homepage{
              height:auto;
              width:80%;
              box-shadow: 0 4px 10px rgba(0, 0, 0, 0.4);
              transition: background 0.3s ease, height 0.3s ease;
              display: flex;
              align-items: center;
              justify-content: flex-start;
              padding: 20px;
          }
  
    #Logoname {
      filter: drop-shadow(2px 2px 2px rgba(0,0,0,0.5));
      margin-right: 10px;
      box-shadow:none;
      margin-left: 5px;
      width: auto;
      height: 75px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
    }
    
          #siteheader-content {
            display: flex;
            align-items: center;
            gap: 30px;
          }
        
          #siteheader-content span {
            font-size: 1.2rem;
            color: #ffffff; 
            font-weight: 600;
            text-shadow: 2px 0px 2px rgba(0,0,0,0.9);
            transition-duration: 0.5s;
          }

          /* Button Styling */
          button {
              padding: 10px 18px;
              background-color: #ff6f61;
              color: white;
              border: none;
              height:50px;
              border-radius: 5px;
              cursor: pointer;
              transition: all 0.3s ease-in-out;
              font-size: 1rem;
          }
  
          button:hover {
              background-color: #ff443d;
              transform: scale(1.05);
              box-shadow: 0 4px 10px rgba(255, 69, 58, 0.5);
          }
  
          /* Textarea Styling */
          textarea {
              border-radius: 5px;
              padding: 10px;
              width: 100%;
              max-width: 700px; /* Reduced size */
              min-width:320px;
              min-height: 125px; /* Reduced size */
              border: none;
              outline: none;
              box-shadow: 0 4px 10px rgba(0, 0, 0, 0.4);
              resize: none;
              transition: all 0.3s ease-in-out;
          }
  
          textarea:focus {
              transform: scale(1.02);
              border: 2px solid #ff6f61;
          }
  
          /* Container for Buttons and Text Areas */
          #addbut, #dbut2 {
              display: flex;
              
              justify-content: center;
              align-items: center;
              margin: 20px;
              gap: 10px;
          }
          #dbut2{
            
          }
  
          /* Game Window */
          #gameWindow {
              padding: 10px;
              background: rgba(255, 255, 255, 0.1);
              border-radius: 10px;
              box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
              width: 90%; /* Increased size */
              height: 80vh; /* Increased size */
              margin: 20px auto;
          }
  
          /* Animations */
          @keyframes fadeIn {
              from {
                  opacity: 0;
                  transform: translateY(-20px);
              }
              to {
                  opacity: 1;
                  transform: translateY(0);
              }
          }
  
          body, button, textarea {
          
              animation: fadeIn 0.8s ease-in-out;
          }
          
  
          /* Responsive Design */
          @media (max-width: 768px) {
              textarea {
                  width: 100%;
                  height:120px;
              }
              #
  
              button {
                  width: 80%;
                  height:50px;
                  font-size: 0.9rem;
              }
  
              #gameWindow {
                  width: 100%; /* Adjust for smaller screens */
                  height: 60vh; /* Adjust for smaller screens */
              }
              #uencont{
              display:none;
              height:0px;
              }
          }
          </style>
          <script src="https://code.jquery.com/jquery-3.6.0.min.js"></script>
          <script src="https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js"></script>
  
      </head>
      <body>
          <div id="siteheader">
              <div id = "Logoname"><span>Interactive Web</span></div>
              <div id="siteheader-content">
               <button id="loginButton" style="display: none;" onclick="googleSignIn()">Login</button>
               <button id="logoutButton" style="display: none;" onclick="signOutOfAccount()">Logout</button>
            </div>
          </div>
          <div id="addbut">
              <button id="sendadditional" onclick="send(true)">Send Comments</button>
              <div id="adminButtons" style="display: none;">
                <button id="confirmRunButton">UPDATE</button>
                <button id="revertButton">REVERT</button>
              </div>
              <button onclick="openFullscreen()">Fullscreen</button>
  
            
            
  
              <button id="downloadZip">Download ZIP</button>
              
              
          </div>
          
          <div id="dbut2">
              <textarea id="additional" placeholder="Enter additional comments"></textarea>
              <textarea id="gametype" placeholder="Put the type of game you want to have.">${title}</textarea>
          </div>
  
          ${htmlcode}
          <div id = "uencont" display = "none" visibility = "hidden">
            <span id = "useremail" style="font-size:0px"display = "none">Log In</span>
            <span id = "username" style="font-size:0px" display = "none">Log In</span>
          </div>
        <script type="module">
          // Import the Firebase modules
          import { initializeApp } from 'https://www.gstatic.com/firebasejs/11.1.0/firebase-app.js';
          import { getAuth, signOut, GoogleAuthProvider, signInWithPopup, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/11.1.0/firebase-auth.js';
          import { getFirestore, doc, getDoc, setDoc } from 'https://www.gstatic.com/firebasejs/11.1.0/firebase-firestore.js';
          const firebaseConfig = {
            apiKey: "//hidden",
            authDomain: "vyxels-ebe71.firebaseapp.com",
            projectId: "vyxels-ebe71",
            storageBucket: "vyxels-ebe71.appspot.com",
            messagingSenderId: "47088410162",
            appId: "1:47088410162:web:bde486ca6e1f8e5c61262b",
            measurementId: "G-FCRZBN52EQ"
          };
  
          // Initialize Firebase
          const app = initializeApp(firebaseConfig);
          const auth = getAuth(app);
          const db = getFirestore(app);
  
          async function signOutOfAccount() {
            try {
              await signOut(auth);
              console.log("Signed out successfully");
            } catch (error) {
              console.error("Sign out error:", error);
            }
          }
  
          async function checkAdminPrivileges(userEmail) {
    try {
      const adminDocRef = doc(db, 'admins', 'admin'); // Adjusted to match your structure
      const adminDoc = await getDoc(adminDocRef);
  
      if (adminDoc.exists()) {
        const adminData = adminDoc.data();
  
        // Check if the user's email matches any of the fields
        return Object.values(adminData).includes(userEmail);
      } else {
        console.error('Admin document does not exist');
        return false;
      }
    } catch (error) {
      console.error('Error checking admin privileges:', error);
      return false;
    }
  }
          async function googleSignIn() {
            const provider = new GoogleAuthProvider();
            try {
              const result = await signInWithPopup(auth, provider);
              const user = result.user;
  
              if (user) {
                console.log("Signed in as:", user.displayName || user.email);
                const userRef = doc(db, "users", user.uid);
                const userSnap = await getDoc(userRef);
  
                if (!userSnap.exists()) {
                  await setDoc(userRef, {
                    email: user.email,
                    name: user.displayName,
                    uid: user.uid
                  });
                }
              }
            } catch (error) {
              console.error("Error during sign-in:", error);
            }
          }
  
          window.signOutOfAccount = signOutOfAccount;
          window.googleSignIn = googleSignIn;
          onAuthStateChanged(auth, async (user) => {
    if (user) {
      // User is logged in
      document.getElementById('loginButton').style.display = 'none';
      document.getElementById('logoutButton').style.display = 'block';
      document.getElementById('useremail').textContent = user.email;
      document.getElementById('username').textContent = user.displayName;
      
  
      const isAdmin = await checkAdminPrivileges(user.email);
      if (isAdmin) {
        document.getElementById('adminButtons').style.display = 'block';
      } else {
        document.getElementById('adminButtons').style.display = 'none'; // Explicitly hide admin buttons for non-admins
        console.log('User is not an admin');
      }
    } else {
      document.getElementById('logoutButton').style.display = 'none';
      document.getElementById('loginButton').style.display = 'block';
  
      // Explicitly hide admin buttons when user logs out
      document.getElementById('adminButtons').style.display = 'none';
      console.log('No user logged in');
    }
  });
  
        </script>
  
          <script>
          
       ${jscode}
  
  document.getElementById('downloadZip').addEventListener('click', () => {
                // Retrieve the content from the text areas
                const htmlContent = \`${downloadedhtml}\`;
                const cssContent = \`${csscode}\`;
                const jsContent = \`${jscode}\`;
  
                // Initialize JSZip
                const zip = new JSZip();
  
                // Add files to the zip
                zip.file('index.html', htmlContent);
                zip.file('styles.css', cssContent);
                zip.file('script.js', jsContent);
  
                // Generate the zip file
                zip.generateAsync({ type: 'blob' }).then((content) => {
                  // Create a link to download the zip
                  const link = document.createElement('a');
                  link.href = URL.createObjectURL(content);
                  link.download = '${title}.zip';
                  link.click();
                });
              });
  
  
              function openFullscreen() {
                  var elem = document.getElementById("gameWindow");
                  if (elem.requestFullscreen) {
                      elem.requestFullscreen();
                  } else if (elem.webkitRequestFullscreen) {
                      elem.webkitRequestFullscreen();
                  } else if (elem.msRequestFullscreen) {
                      elem.msRequestFullscreen();
                  }
              }
  
              function send(bool) {
                  
                  var additional = bool === true ? document.getElementById("additional").value : bool;
                  $.ajax({
                      type: "POST",
                      url: "/submit-comments",
                      contentType: "application/json",
                      data: JSON.stringify({ additionalcomments: additional, gametype: document.getElementById("gametype").value }),
                      success: function(response) { console.log("Data sent successfully:", response); },
                      error: function(error) { console.error("Error sending data:", error); }
                  });
              }
  
              document.getElementById("confirmRunButton").onclick = function() {
                  $.ajax({
                      type: "POST",
                      url: "/confirm-and-run",
                      contentType: "application/json",
                      data: JSON.stringify({ data: document.getElementById("gametype").value }),
                      success: function(response) { console.log("Confirm and run initiated successfully:", response); 
                      },
                      error: function(error) { console.error("Error initiating confirm and run:", error); }
                  });
              };
  
              document.getElementById("revertButton").onclick = function() {
                  $.ajax({  
                      type: "POST",
                      url: "/revert",
                      contentType: "application/json",
                      data: JSON.stringify({ data: document.getElementById("gametype").value }),
                      success: function(response) { console.log("Revert initiated successfully:", response); 
                      reloadClients();},
                      error: function(error) { console.error("Error initiating revert:", error); }
                  });
              };
  
              // Set up SSE listener to reload page when triggered
              const eventSource = new EventSource('/stream-updates');
              eventSource.onmessage = function(event) {
                  const emessage = event.data;
                  if (emessage === "reload") {
                      location.reload(); // Reload the page when a "reload" message is received
                  } else if (emessage === "UPDATE ALREADY PENDING"){
                    alert(emessage);
              
                    //can also replace with something else 
                  } else {
                    message = JSON.parse(emessage);
                    console.log(message)
                    
  
                     ${mpcode}
                  }
              };
                  
              
  
              window.onerror = function(message, source, lineno, colno, error) {
  
  
                      bool =  error; 
                      if(typeof bool==="string" && bool != {}){
                        send(bool)
                      }
                  };
          </script>
          <br>
          <!--<textarea class="ctextarea">${htmlcode}</textarea>
          <textarea class="ctextarea">${csscode}</textarea>
          <textarea class="ctextarea">${jscode}</textarea>
          <textarea class="ctextarea">${mpcode}</textarea>  -->
      </body>
      </html>
    `);
  });
  
  app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
  });
  
  if (jsonData.length == 0) {
    console.log("data.json is empty or invalid, generating initial data");
  
    //chatgpt will generate code for a game.
  
    //API key is not there
    if (process.env.OPENAI_API_KEY === "") {
      console.error(
        `You haven't set up your API key yet. Open the Secrets Tool and add OPENAI_API_KEY as a secret.`,
      );
      process.exit(1);
    }
  
    const openai = new OpenAI({
      apiKey: mySecret,
    });
  
    const GPT4Message = [
      {
        role: "system",
        content:"Generate complete HTML, CSS, and JavaScript code with all parts included, separating sections as follows: Use '```html', '```css', and '```javascript', ending each section with '```'. If multiplayer is needed, use the following code: $.ajax({type: \"POST\", url: \"/skibidi\", data: JSON.stringify([put data here]), contentType: \"application/json\", success: response => console.log(\"Confirm and run initiated successfully:\", response), error: error => console.error(\"Error initiating confirm and run:\", error)}); . Provide a '```multiplayer' to handle receiving data, which is inside of the variable 'message' in this section. There is no need for any sort of WebSockets or anything else, just normal data and javascript code. All servers will be provided. Make sure to call any functions defined in '```multiplayer' inside of itself. HTML should contain only <body> content, using <script type='module'> for libraries. CSS should style all UI for desktop and mobile without images, using only colored <div>s. Our color scheme is from red to purple. Avoid overlaying text on matching background colors. For JavaScript: Include all game logic and send JSON data to the server using AJAX at /skibidi with a data: tag. Use the message variable for communication, Ensure all variables are defined and code is error-free. Fix bugs if line/column numbers are provided. If told to access email, use document.getElementById('useremail').textContent or document.getElementById('username').textContent; both of which are already given. Avoid ${} syntax entirely. If no changes are needed, include the original code, Add an update menu that pauses the game, shows updates, and allows resuming. Otherwise, enhance gameplay mechanics, ensure compatibility with mobile and desktop, and integrate single-player and multiplayer seamlessly. Don't put comments explaining the code.",
      },
      {
        role: "user",
        content: "Can you design a gamewindow with some elements?",
        //"Can you make a HTML, CSS, and Javascript code for a game that uses WASD to move? "
      },
    ];
  
    let GPT4 = async (message) => {
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        temperature: 0.4,
        messages: message,
      });
  
      return response.choices[0].message.content;
    };
  
    const allcode = (await GPT4(GPT4Message)) || "";
  
    //splits into html section, css section, and javascript section
    const htmlMarker = "```html";
    const htmlStartIndex = allcode.indexOf(htmlMarker);
    let html = "";
    if (htmlStartIndex !== -1) {
      const htmlEndIndex = allcode.indexOf(
        "```",
        htmlStartIndex + htmlMarker.length,
      );
      if (htmlEndIndex !== -1) {
        html = allcode
          .substring(htmlStartIndex + htmlMarker.length, htmlEndIndex)
          .trim();
      }
    }
  
    // Extract CSS
    const cssMarker = "```css";
    const cssStartIndex = allcode.indexOf(cssMarker);
    let css = "";
    if (cssStartIndex !== -1) {
      const cssEndIndex = allcode.indexOf(
        "```",
        cssStartIndex + cssMarker.length,
      );
      if (cssEndIndex !== -1) {
        css = allcode
          .substring(cssStartIndex + cssMarker.length, cssEndIndex)
          .trim();
      }
    }
  
    // Extract JavaScript
    const jsMarker = "```javascript";
    const jsStartIndex = allcode.indexOf(jsMarker);
    let js = "";
    if (jsStartIndex !== -1) {
      const jsEndIndex = allcode.indexOf("```", jsStartIndex + jsMarker.length);
      if (jsEndIndex !== -1) {
        js = allcode.substring(jsStartIndex + jsMarker.length, jsEndIndex).trim();
      }
    }
    const mpMarker = "```multiplayer";
    const mpStartIndex = allcode.indexOf(mpMarker);
    let mp = "";
    if (mpStartIndex !== -1) {
      const mpEndIndex = allcode.indexOf("```", mpStartIndex + mpMarker.length);
      if (mpEndIndex !== -1) {
        mp = allcode.substring(mpStartIndex + mpMarker.length, mpEndIndex).trim();
      }
    }
    console.log(allcode);
    console.log("\n");
    console.log(html);
    console.log("\nENDOFHTML\n");
    console.log(css);
    console.log("\nENDOFCSS\n");
    console.log(js);
    console.log("\nENDOFJS\n");
    console.log(mp);
    console.log("\nENDOFMP\n");
    
    const allData = {
      title: "",
      html: html,
      css: css,
      javascript: js,
      multiplayer: mp,
    };
  
    // Add the new data
    addData(allData, "data.json");
  } else {
    console.log("Data.json is not empty, skipping initial data generation");
  }
  function updatehome(){
    //yo how this work
    //like what you need this to do
  }
  function updates(updatetype) {
    console.log(updatetype);
    console.log("Started updating");
  
    const dataFilePath = path.join(__dirname, `${updatetype}.json`);
    const errorFilePath = path.join(__dirname, "errors.json");
    const homeFilePath = path.join(__dirname, "home.json");
    let title, htmlupdate, cssupdate, javascriptupdate, multiplayerupdate;
  
    // Function to read JSON file or create it if it doesn't exist
    function readOrCreateJSONFile(filePath) {
      if (!fs.existsSync(filePath)) {
        fs.writeFileSync(filePath, JSON.stringify([]));
        
      }
      return JSON.parse(fs.readFileSync(filePath, "utf-8"));
    }
  
    const jsonData = readOrCreateJSONFile(dataFilePath);
    const errorData = readOrCreateJSONFile(errorFilePath);
    const homeData = readOrCreateJSONFile(homeFilePath);
  
    
    const allsuggestions = [];
  
    for (let i = 0; i < errorData.length; i++) {
      if (!allsuggestions.includes(errorData[i].suggestions) && errorData[i].gametype == updatetype) {
  
        allsuggestions.push(errorData[i].suggestions);
      }
    }
  
    console.log(allsuggestions);
  
    if (jsonData.length > 0) {
      title = jsonData[jsonData.length - 1].title;
      htmlupdate = jsonData[jsonData.length - 1].html;
      cssupdate = jsonData[jsonData.length - 1].css;
      javascriptupdate = jsonData[jsonData.length - 1].javascript;
      multiplayerupdate = jsonData[jsonData.length - 1].multiplayer;
      console.log("\n" + allsuggestions + "\n\nadditional comments logged\n");
    } else {
      htmlupdate = cssupdate = javascriptupdate = multiplayerupdate = "";
    }
  
    if (title !== updatetype) {
      console.log("Title is not the same as the update type, making new game");
      for (let i = jsonData.length - 1; i >= 0; i--) {
        if (jsonData[i].title === updatetype) {
          htmlupdate = jsonData[i].html;
          cssupdate = jsonData[i].css;
          javascriptupdate = jsonData[i].javascript;
          multiplayerupdate = jsonData[i].multiplayer;
          break;
        }
      }
    }
  
    let revert = 2;
    while (
      htmlupdate === "" ||
      cssupdate === "" ||
      htmlupdate.includes("rest of code") ||
      cssupdate.includes("rest of code") ||
      javascriptupdate.includes("rest of code")
    ) {
      if (jsonData.length - revert < 0) break;
  
      htmlupdate = jsonData[jsonData.length - revert].html || "";
      cssupdate = jsonData[jsonData.length - revert].css || "";
      javascriptupdate = jsonData[jsonData.length - revert].javascript || "";
      multiplayerupdate = jsonData[jsonData.length - revert].multiplayer || "";
      revert++;
    }
  
    if (!process.env.OPENAI_API_KEY) {
      console.error("You haven't set up your API key yet.");
      process.exit(1);
    }
  
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  
    const GPT4Message = [
      {
        role: "system",
        content:"Generate complete HTML, CSS, and JavaScript code with all parts included, separating sections as follows: Use '```html', '```css', and '```javascript', ending each section with '```'. If multiplayer is needed, use the following code: $.ajax({type: \"POST\", url: \"/skibidi\", data: JSON.stringify([put data here]), contentType: \"application/json\", success: response => console.log(\"Confirm and run initiated successfully:\", response), error: error => console.error(\"Error initiating confirm and run:\", error)}); . Provide a '```multiplayer' to handle receiving data, which is inside of the variable 'message' in this section. There is no need for any sort of WebSockets or anything else, just normal data and javascript code. All servers will be provided. Make sure to call any functions defined in '```multiplayer' inside of itself. HTML should contain only <body> content, using <script type='module'> for libraries. CSS should style all UI for desktop and mobile without images, using only colored <div>s. Our color scheme is from red to purple. Avoid overlaying text on matching background colors. For JavaScript: Include all game logic and send JSON data to the server using AJAX at /skibidi with a data: tag. Use the message variable for communication, Ensure all variables are defined and code is error-free. Fix bugs if line/column numbers are provided. If told to access email, use document.getElementById('useremail').textContent or document.getElementById('username').textContent; both of which are already given. Avoid ${} syntax entirely. If no changes are needed, include the original code, Add an update menu that pauses the game, shows updates, and allows resuming. Otherwise, enhance gameplay mechanics, ensure compatibility with mobile and desktop, and integrate single-player and multiplayer seamlessly. Don't put comments explaining the code.",
  
      },
      {
        role: "user",
        content:
          ` Improve and debug the ${updatetype} using this code: ` +
          "\n```\n" +
          `HTML: ` +
          "\n```\n" +
          htmlupdate +
          "\n```\n" +
          `Javascript: ` +
          "\n```\n" +
          javascriptupdate +
          "\n```\n" +
          "multiplayer features(also js): " +
          "\n```\n" +
          multiplayerupdate +
          "\n```\n" +
          "CSS: " +
          "\n```\n" +
          cssupdate +
          "\n```" +
          "Bugs/Suggestions: " +
          "\n'''\n" +
          allsuggestions,
      },
    ];
  
    const GPT4 = async (message) => {
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        temperature: 0.4,
        messages: message,
      });
      return response.choices[0].message.content;
    };
  
    (async () => {
      const allcode2 = (await GPT4(GPT4Message)) || "";
      console.log(allcode2 + "\n------------GPTMESSAGE-----------\n");
  
      const extractCode = (marker) => {
        const startIndex = allcode2.indexOf(marker);
        if (startIndex === -1) return "";
        const endIndex = allcode2.indexOf("```", startIndex + marker.length);
        return endIndex !== -1
          ? allcode2.substring(startIndex + marker.length, endIndex).trim()
          : "";
      };
  
      const html2 = extractCode("```html");
      const css2 = extractCode("```css");
      const js2 = extractCode("```javascript");
      const mp2 = extractCode("```multiplayer");
  
      const allData = {
        title: updatetype,
        html: html2,
        css: css2,
        javascript: js2,
        multiplayer: mp2,
      };
  
      let hometitle = homeData[homeData.length - 1].title;
      let homehtml = homeData[homeData.length - 1].html;
      let homecss = homeData[homeData.length - 1].css;
      let homejs = homeData[homeData.length - 1].javascript;
      let homemp = homeData[homeData.length - 1].multiplayer;
      
     
      if (title !== updatetype) {
        let contenthtml = homehtml;
  
        // Define the new link container with the <a> tag inside it
        const newLinkContainer = `
        <div class="link-container">
          <a href="/${updatetype.replace(/ /g, "%20")}" class="link">Go to ${updatetype}</a>
        </div>`;
  
        // Append the new link container after the last one in the HTML
        let updatedHTML = contenthtml.replace(
          /<\/div>\s*<\/div>/,
          `</div>${newLinkContainer}</div>`
        );
  
        console.log(updatedHTML);
  
        homeData[homeData.length - 1].html = updatedHTML;
        fs.writeFileSync(homeFilePath, JSON.stringify(homeData, null, 2), 'utf8');
  
        console.log('home.json updated successfully with new link container!');
      }
  
  
      fs.writeFileSync(dataFilePath, JSON.stringify([...jsonData, allData]));
      revertErrorsJson(updatetype)
      reloadClients();
      pending = !pending;
    })();
  }
  function revertErrorsJson(updatetype) {
    const errorFilePath = path.join(__dirname, "errors.json");
  
    fs.readFile(errorFilePath, "utf-8", (err, data) => {
      if (err) {
        if (err.code === "ENOENT") {
          console.log("errors.json does not exist, nothing to revert.");
          return;
        }
        console.error("Error reading the errors.json file:", err);
        return;
      }
  
      try {
        // Parse the JSON data (assuming it's an array)
        let jsonData = JSON.parse(data);
  
        // Remove all elements with the matching gametype
        let initialLength = jsonData.length;
        jsonData = jsonData.filter(item => item.gametype !== updatetype);
  
        if (jsonData.length < initialLength) {
          // Convert the updated array back to JSON
          const updatedJson = JSON.stringify(jsonData, null, 2);
  
          // Write the updated JSON back to the errors.json file
          fs.writeFile(errorFilePath, updatedJson, "utf-8", (writeErr) => {
            if (writeErr) {
              console.error("Error writing to errors.json:", writeErr);
            } else {
              console.log(`${initialLength - jsonData.length} matching elements removed and errors.json updated successfully.`);
            }
          });
        } else {
          console.log("No matching gametype found to remove.");
        }
      } catch (parseError) {
        console.error("Error parsing the JSON data in errors.json:", parseError);
      }
    });
    reloadClients();
  }
  
  
  
  
  function revertjson(updatetype) {
    const errorFilePath = path.join(__dirname, "errors.json");
    const filePath = path.join(__dirname, `${updatetype}.json`);
    console.log(filePath)
  
    fs.readFile(filePath, "utf-8", (err, data) => {
      if (err) {
        if (err.code === "ENOENT") {
          console.log("File does not exist, nothing to revert.");
          return;
        }
        console.error("Error reading the file:", err);
        return;
      }
  
      try {
        // Parse the JSON data (assuming it's an array)
        let jsonData = JSON.parse(data);
  
        // Remove the last element in the array
        jsonData.pop();
  
        // Convert the updated array back to JSON
        const updatedJson = JSON.stringify(jsonData, null, 2);
  
        // Write the updated JSON back to the file
        fs.writeFile(filePath, updatedJson, "utf-8", (err) => {
          if (err) {
            console.error("Error writing to the file:", err);
          } else {
            clearjson(errorFilePath);
            console.log("Last element removed and file updated successfully");
          }
        });
      } catch (parseError) {
        console.error("Error parsing the JSON data:", parseError);
      }
    });
  }
  //functions
  function readJSONFile(filename) {
    try {
      const jsonString = fs.readFileSync(filename, "utf8");
      return JSON.parse(jsonString);
    } catch (error) {
      console.error("Error reading JSON file:", error);
      return null;
    }
  }
  
  function addData(newData, filePath) {
    // Ensure the file exists
    if (!existsSync(filePath)) {
      // Create an empty JSON array if the file doesn't exist
      writeFileSync(filePath, JSON.stringify([]));
    }
  
    // Read the existing data
    let data = [];
    try {
      const rawData = readFileSync(filePath, "utf-8");
      data = JSON.parse(rawData);
    } catch (error) {
      if (error.code !== "ENOENT" && error.name !== "SyntaxError") {
        console.error("Error reading or parsing data.json:", error);
        return;
      }
      console.log("data.json is empty or invalid, initializing as empty array");
    }
  
    // Ensure data is an array
    if (!Array.isArray(data)) {
      throw new Error("JSON data is not an array");
    }
  
    // Add the new data
    data.push(newData);
  
    // Write the updated data back to the file
    writeFileSync(filePath, JSON.stringify(data, null, 2));
    console.log("Data added to file.");
  }
  function clearjson(file) {
    // Read the JSON file
    fs.readFile(file, "utf8", (err, data) => {
      if (err) {
        console.error("Error reading the file:", err);
        return;
      }
  
      // Parse the JSON data
      let jsonData = JSON.parse(data);
  
      // Clear the JSON data (set to an empty object or array)
      // Example: if your JSON is an object
      jsonData = [];
  
      // Example: if your JSON is an array
      // jsonData = [];
  
      // Write the cleared data back to the file
      fs.writeFile(file, JSON.stringify(jsonData, null, 2), "utf8", (err) => {
        if (err) {
          console.error("Error writing to the file:", err);
          return;
        }
        console.log("File has been cleared successfully!");
      });
    });
  }
  
  
  
