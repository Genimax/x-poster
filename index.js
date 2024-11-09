require("dotenv").config();
const OpenAI = require("openai");
const { TwitterApi } = require("twitter-api-v2");

// Initialize OpenAI Client
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Initialize Twitter Client
const twitterClient = new TwitterApi({
  appKey: process.env.TWITTER_APP_KEY,
  appSecret: process.env.TWITTER_APP_SECRET,
  accessToken: process.env.TWITTER_ACCESS_TOKEN,
  accessSecret: process.env.TWITTER_ACCESS_SECRET,
});

// Function to Generate Content Using OpenAI
async function generateContent() {
  console.log("--- 0% --- Generating Content...");

  const task =
    "You are a software engineer and a twitter blogger, who post on X(twitter) threads, and your goal is to generate content that resonates with the audience. Write as a human in real world. The " +
    "content should be threads engaging, informative, and relevant to the topic. It must be in english. sometimes add Zoomers slang and once you can swear, Make it humane as much as possible! Answer only in JSON format so it must  be easy to parse thread into posting it. JSON must be structured as {thread: [{content: first text}, {content: second text} etc...]}. Don't use MARKDOWN";
  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      { role: "system", content: task },
      {
        role: "user",
        content:
          "Use lowercase. Take a very highly specialized topic that you can never take twice if it was a random that will represent a valuable information" +
          " in the interests of software workers, not businesses and create a thread about it. No hashtags please. 16 posts in one thread maximum but 8-11 is perfect. It should be useful and viral for those who care about their own well-being, not the well-being of the companies and businesses they work for.",
      },
    ],
  });

  return JSON.parse(response.choices[0].message.content.trim());
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function postThread(threadObject) {
  console.log("--- 50% --- Posting Thread...");
  const { thread } = threadObject; // Destructure the thread array from the object
  let lastTweetId = null;

  for (const tweetContent of thread) {
    const tweetData = { text: tweetContent.content };

    // Only include the reply parameter if lastTweetId is set (not null)
    if (lastTweetId) {
      tweetData.reply = { in_reply_to_tweet_id: lastTweetId };
    }

    const tweetResponse = await twitterClient.v2.tweet(tweetData);
    console.log(tweetResponse);
    lastTweetId = tweetResponse.data.id; // Update lastTweetId to maintain thread sequence

    // Wait 20 seconds before posting the next tweet
    await delay(20000);
  }
}

const main = async () => {
  try {
    const content = await generateContent(); // Assume generateContent fetches the thread object
    await postThread(content);
    console.log("--- 100% --- Thread posted successfully.");
  } catch (error) {
    console.error("--- Error:", error);
  }
};

main();
