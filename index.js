const express = require('express');
const app = express();
const multer = require('multer'); // To handle file uploads
const pdfReader = require('./pdf'); // Import the PDF reading function
const { Configuration, OpenAIApi } = require('openai');
const cors = require('cors');
const dotenv = require('dotenv');
dotenv.config();

let openai = null;
let pdfContent = '';

app.use(express.json());
app.use(
  cors({
    origin: '*',
  })
);
const upload = multer();

app.get('/', (req, res) => {
  res.send('Hello World!');
});

app.listen(3000, () => console.log('Server running on port 3000'));

app.post('/read-pdf', upload.single('pdfFile'), async (req, res) => {
  try {
    const pdfFileBuffer = Uint8Array.from(req.file.buffer); // Convert Buffer to Uint8Array
    const textContent = await pdfReader(pdfFileBuffer);
    pdfContent = textContent;
    console.log('PDF text content:', textContent);
    res.status(200).json({ textContent });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error reading PDF file.' });
  }
});

const SYSTEM_PROMPT =
  'You are an AI interviewer helper your name is Querell AI your task is to read the input questions given in the form of pdfContent and ask questions based on it ,first go with  the introduction and academic background of the user then proceed to qustions,make sure to ask minimum 3 follow up questions based on the responses,and ask different different questions to test the skills of the user: \n\n' +
  pdfContent +
  '\n\n\n\n\n\n\n\n' +
  'Remember to ask different the questions in a sequence and read user input and ask follow up new  questions based on user response  . \n\n\n';

app.post('/chat', async (req, res) => {
  try {
    const messages = req.body.messages || [];
    messages.push({ role: 'system', content: SYSTEM_PROMPT });

    const chat_completion = await openai.createChatCompletion({
      model: 'gpt-3.5-turbo',
      messages: messages,
    });

    const botMessage = chat_completion.data.choices[0].message.content;

    console.log(botMessage);

    const responseData = {
      botMessage: botMessage,
    };

    res.send(responseData);
  } catch (error) {
    console.error('Error in /chat endpoint:', error.message);
    res.status(500).send('Internal Server Error');
  }
});

app.post('/get-api-key', (req, res) => {
  try {
    const { apiKey } = req.body;

    if (!apiKey) {
      return res.status(400).json({ error: 'API key is required.' });
    }

    // Create a new instance of OpenAIApi with the provided API key
    const configuration = new Configuration({
      apiKey: apiKey,
    });

    // Update the existing openai instance with the new configuration
    openai = new OpenAIApi(configuration);

    res.status(200).json({ message: 'API key received successfully.' });
  } catch (error) {
    console.error('Error in /get-api-key endpoint:', error.message);
    res.status(500).send('Internal Server Error');
  }
});
