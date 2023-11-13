import express from "express";
import admin from "firebase-admin";
import serviceAccount from "./google-service.json";
import bodyParser from "body-parser";
import { v4 as uuidv4 } from "uuid";
import multer from "multer";
import { sliceIntoChunks } from "./utils";

const app = express();
const port = process.env.PORT || 3000;

var upload = multer();
app.use(express.json());
app.use(bodyParser.json());

app.use(bodyParser.urlencoded({ extended: true }));

app.use(upload.array());

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});
const firestoreDB = admin.firestore();

app.get("/", (req, res) => {
  res.send("Viendongedu notification!");
});

app.post("/test", function (req, res) {
  console.dir(req.body);
  res.send("tested");
});

app.post("/notify", function (req, res) {
  // Create a list containing up to 500 registration tokens.
  // These registration tokens come from the client FCM SDKs.
  const data = req.body;
  let i = 0;
  for (const tokenChunk of sliceIntoChunks(data.tokens, 200)) {
    console.log("chunk ", i);
    i++;
    const message = {
      notification: {
        title: data.title,
        body: data.msg,
      },
      tokens: tokenChunk,
    };
    const fsNotificationData = {
      ...message,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      tokens: tokenChunk.map((e) => ({
        token: e.trim(),
        status: 0,
      })),
    };
    console.log(fsNotificationData);
    // create noti data
    firestoreDB
      .collection("Notification")
      .doc(uuidv4())
      .set(fsNotificationData);
    // send noti
    admin
      .messaging()
      .sendMulticast(message)
      .then((response) => {
        console.log("message:", response);

        res.send(response);
      })
      .catch((error) => {
        console.log("error:", error);

        res.send(error);
      });
  }
});

// Initialize Firebase
app.post("/notifyToken", function (req, res) {
  for (const token of sliceIntoChunks(req.body.tokens, 200)) {
    sendMessage(token, req.body.title, req.body.msg, req.body.channel);
  }
  res.send("Sent!");
});

async function sendMessage(token, title, msg, channel) {
  // Fetch the tokens from an external datastore (e.g. database)
  // Send a message to devices with the registered tokens
  // const tokens=[token];

  await admin.messaging().sendMulticast({
    token,
    data: {
      notifee: JSON.stringify({
        body: msg,
        android: {
          channelId: channel,
          actions: [
            {
              title: title,
              pressAction: {
                id: "read",
              },
            },
          ],
        },
      }),
    },
  });
}

app.listen(port, () => {
  console.log(`Viendong firebase api listening at ${port}`);
});
