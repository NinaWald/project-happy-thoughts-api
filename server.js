import express from "express";
import cors from "cors";
import mongoose from "mongoose";

const mongoUrl = process.env.MONGO_URL || "mongodb://127.0.0.1:27017/project-happy-thoughts-api";
mongoose.connect(mongoUrl, { useNewUrlParser: true, useUnifiedTopology: true });
mongoose.Promise = Promise;

// Defines the port the app will run on. Defaults to 8080, but can be overridden
// when starting the server. Example command to overwrite PORT env variable value:
// PORT=9000 npm start
const port = process.env.PORT || 8080;
const app = express();

// Add middlewares to enable cors and json body parsing
app.use(cors());
app.use(express.json());

const { Schema } = mongoose;

const HappyThoughtsSchema = new Schema({
  text: {
    type:String,
    required: true,
    minlength: 6,
    maxlength: 140
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  likes: {
    type: Number,
    default: 0
  }
})
const HappyThoughts = mongoose.model("HappyThoughts", HappyThoughtsSchema);


app.get("/", (req, res) => {
  const endpoints = app._router.stack
    .filter((route) => route.route && route.route.path)
    .map((route) => ({
      path: route.route.path,
      method: Object.keys(route.route.methods)[0],
    }));

  res.json(endpoints);
});


app.get('/thoughts', async (req, res) => {
  try {
    const thoughts = await HappyThoughts.find()
    .sort({createdAt: 'desc'})
    .limit(20)
    .exec();
    res.json(thoughts);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch messages "})
  }
  });

app.post('/thoughts', async (req, res) => {
  const { text } = req.body;
  const thought = new HappyThoughts({ text });

  try{
    const savedThought = await thought.save()
    res.status(201).json(savedThought)
  } catch (err){
    console.error(err);
    res.status(400).json({message: 'Could not save thought', error:err.errors})
  }
})

app.patch('/thoughts/:id/like', async (req, res) => {
  const { id } = req.params;

  try {
    const thought = await HappyThoughts.findByIdAndUpdate(id, { $inc: { likes: 1 } }, { new: true });
    if (!thought) {
      return res.status(404).json({ message: 'Thought not found' });
    }
    res.status(200).json({ message: 'Thought liked successfully' })
  } catch (err) {
    console.error(err);
    res.status(400).json({ message: 'Like not successfull', error: err.errors })
  }
})

// Start the server
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
