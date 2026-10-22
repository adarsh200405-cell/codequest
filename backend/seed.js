import dotenv from "dotenv";
dotenv.config();
import mongoose from "mongoose";
import Language from "./src/models/Language.js";
import Lesson from "./src/models/Lesson.js";
import Quiz from "./src/models/Quiz.js";

const languages = [
  { name:"Python", slug:"python", category:"Programming", difficulty:"Beginner", tagline:"Readable code for many kinds of problems.", description:"Python is a high-level, general-purpose programming language known for readable syntax and a large ecosystem.", uses:["AI and machine learning","Automation","Data analysis","Backend services"], strengths:["Readable syntax","Large learning community","Extensive libraries"], limitations:["Can be slower than compiled languages for some workloads","Dependency and environment management needs care"], exampleCode:'print("Hello, World!")', exampleOutput:"Hello, World!" },
  { name:"JavaScript", slug:"javascript", category:"Programming", difficulty:"Beginner", tagline:"Make websites interactive and build server applications.", description:"JavaScript is widely used in browsers and also on servers through runtimes such as Node.js.", uses:["Interactive websites","Backend APIs","Web applications"], strengths:["Runs in browsers","One language can be used across frontend and backend"], limitations:["Asynchronous programming can be confusing at first","Browser and runtime environments differ"], exampleCode:'console.log("Hello, World!");', exampleOutput:"Hello, World!" },
  { name:"HTML", slug:"html", category:"Web technology", difficulty:"Beginner", tagline:"Describe the structure and meaning of web pages.", description:"HTML is a markup language, not a general-purpose programming language. It structures content on the web.", uses:["Web page structure","Forms","Accessible content"], strengths:["Essential web foundation","Semantic elements improve accessibility"], limitations:["Does not by itself provide general programming logic"], exampleCode:'<h1>Hello, World!</h1>', exampleOutput:"A large heading: Hello, World!", isMarkupOrQueryLanguage:true },
  { name:"CSS", slug:"css", category:"Web technology", difficulty:"Beginner", tagline:"Control how web pages look and adapt to screens.", description:"CSS is a style sheet language used to describe the presentation of HTML and other documents.", uses:["Layouts","Colors and typography","Responsive design"], strengths:["Separates presentation from content","Supports responsive interfaces"], limitations:["Large stylesheets can become difficult to maintain"], exampleCode:'h1 { color: rebeccapurple; }', exampleOutput:"Headings appear purple.", isMarkupOrQueryLanguage:true },
  { name:"C", slug:"c", category:"Systems", difficulty:"Intermediate", tagline:"Understand memory, low-level concepts, and efficient programs.", description:"C is a compiled general-purpose language widely used in systems and embedded software.", uses:["Operating system components","Embedded systems","Libraries"], strengths:["Small runtime","Fine-grained memory control"], limitations:["Manual memory management can cause bugs"], exampleCode:'#include <stdio.h>\\nint main(void) { printf("Hello, World!\\\\n"); return 0; }', exampleOutput:"Hello, World!" },
  { name:"C++", slug:"cpp", category:"Systems", difficulty:"Intermediate", tagline:"Build performance-sensitive software and games.", description:"C++ supports procedural, object-oriented, and generic programming, and is used where performance and control matter.", uses:["Game engines","Graphics","High-performance software"], strengths:["Performance and control","Broad ecosystem"], limitations:["Complex language and build tooling"], exampleCode:'#include <iostream>\\nint main() { std::cout << "Hello, World!"; }', exampleOutput:"Hello, World!" },
  { name:"Java", slug:"java", category:"Programming", difficulty:"Beginner", tagline:"Build portable applications with a mature ecosystem.", description:"Java is a statically typed, class-based language used across enterprise systems and many application environments.", uses:["Enterprise backend systems","Android development (alongside Kotlin)","Education"], strengths:["Strong tooling","Static type checking","Mature ecosystem"], limitations:["More boilerplate than some languages"], exampleCode:'class Main { public static void main(String[] args) { System.out.println("Hello, World!"); } }', exampleOutput:"Hello, World!" },
  { name:"SQL", slug:"sql", category:"Data", difficulty:"Beginner", tagline:"Ask questions of structured data.", description:"SQL is a language for querying and managing relational databases.", uses:["Reports","Database queries","Data analysis"], strengths:["Purpose-built for relational data","Powerful filtering and aggregation"], limitations:["Different database systems have dialect differences"], exampleCode:'SELECT name FROM students WHERE class_level = 11;', exampleOutput:"Returns names of students in class 11.", isMarkupOrQueryLanguage:true },
  { name:"TypeScript", slug:"typescript", category:"Programming", difficulty:"Intermediate", tagline:"Add static types to JavaScript projects.", description:"TypeScript adds a type system to JavaScript and is compiled to JavaScript for execution.", uses:["Large web applications","Frontend and backend projects"], strengths:["Catches many errors earlier","Improves editor assistance"], limitations:["Requires a build step and learning types"], exampleCode:'const greeting: string = "Hello, World!";\\nconsole.log(greeting);', exampleOutput:"Hello, World!" },
  { name:"Kotlin", slug:"kotlin", category:"Programming", difficulty:"Intermediate", tagline:"A modern language especially popular for Android development.", description:"Kotlin is a statically typed language that interoperates with Java and is widely used for Android apps.", uses:["Android apps","Backend services"], strengths:["Concise syntax","Java interoperability"], limitations:["Some ecosystems and legacy projects remain Java-heavy"], exampleCode:'fun main() { println("Hello, World!") }', exampleOutput:"Hello, World!" },
  { name:"Rust", slug:"rust", category:"Systems", difficulty:"Advanced", tagline:"Build systems software with strong memory-safety guarantees.", description:"Rust is a systems programming language focused on performance and memory safety without a garbage collector.", uses:["Systems tools","Infrastructure","Performance-sensitive services"], strengths:["Memory safety guarantees","Performance"], limitations:["Ownership concepts take time to learn"], exampleCode:'fn main() { println!("Hello, World!"); }', exampleOutput:"Hello, World!" },
  { name:"PHP", slug:"php", category:"Web technology", difficulty:"Beginner", tagline:"A server-side language used in many web applications.", description:"PHP is a server-side scripting language used to build dynamic websites and backend systems.", uses:["Server-rendered websites","Content management systems","Web APIs"], strengths:["Broad hosting support","Mature web ecosystem"], limitations:["Project quality varies with architecture and conventions"], exampleCode:'<?php echo "Hello, World!"; ?>', exampleOutput:"Hello, World!" }
];

const lessons = [
  { title:"What Is a Programming Language?", slug:"what-is-a-programming-language", languageSlug:"python", classLevels:[11,12], difficulty:"Beginner", estimatedMinutes:8, summary:"Understand how humans express instructions that computers can execute.", content:[
    {heading:"From problem to instructions", body:"A programming language provides rules for writing instructions. A compiler or interpreter, along with the runtime environment, helps translate or execute those instructions."},
    {heading:"Different tools for different jobs", body:"Python is often used for automation and AI; JavaScript powers browser interactivity; C and C++ are common in systems and performance-sensitive software. No single language is best for every task."},
    {heading:"Try this idea", body:"Think of a recipe: it has ordered steps and precise instructions. A program is similar, but its instructions must follow the language's syntax and behavior rules."}
  ]},
  { title:"How a Website Works", slug:"how-a-website-works", languageSlug:"javascript", classLevels:[11,12], difficulty:"Beginner", estimatedMinutes:10, summary:"See how HTML, CSS, JavaScript, a backend, and a database fit together.", content:[
    {heading:"The browser side", body:"HTML gives a page structure, CSS controls presentation, and JavaScript can respond to clicks and update the interface."},
    {heading:"The server side", body:"A backend receives requests, applies rules, checks permissions, and returns data. It may be written in JavaScript, Python, Java, PHP, or another language."},
    {heading:"Where data lives", body:"A database stores information so it can be retrieved later. A website may use a relational database with SQL or a document database such as MongoDB."}
  ]},
  { title:"Languages Behind Artificial Intelligence", slug:"languages-behind-ai", languageSlug:"python", classLevels:[11,12], difficulty:"Beginner", estimatedMinutes:12, summary:"Explore the languages and tools commonly used to build AI products.", content:[
    {heading:"Python and its ecosystem", body:"Python is common in AI research and data workflows because libraries support data processing, model training, and experimentation."},
    {heading:"A complete AI product", body:"An AI product may use a web frontend, a backend API, a model service, and a database. Different parts can use different languages."},
    {heading:"Remember", body:"A language alone does not create AI. Models, data, algorithms, infrastructure, evaluation, and responsible design are also important."}
  ]}
];

const quizzes = [
  { title:"Computer Languages Basics", slug:"computer-languages-basics", lessonSlug:"what-is-a-programming-language", questions:[
    {question:"Which is a markup language used to structure web pages?", options:["Python","HTML","C++","SQL"], correctAnswer:1, explanation:"HTML describes the structure and meaning of web content."},
    {question:"Which language is widely used in data science and AI?", options:["CSS","HTML","Python","XML"], correctAnswer:2, explanation:"Python has a large ecosystem for data science and AI."},
    {question:"What is SQL mainly used for?", options:["Styling pages","Querying relational databases","Drawing images","Operating a keyboard"], correctAnswer:1, explanation:"SQL queries and manages data in relational database systems."}
  ]},
  { title:"How Websites Work", slug:"how-websites-work-quiz", lessonSlug:"how-a-website-works", questions:[
    {question:"Which technology mainly controls the presentation of a web page?", options:["CSS","SQL","Bash","C"], correctAnswer:0, explanation:"CSS controls layout, colors, typography, and responsive presentation."},
    {question:"What is a common role of a backend API?", options:["Only change text color","Handle requests and return data","Replace the browser","Physically repair a computer"], correctAnswer:1, explanation:"Backend APIs implement server-side rules and provide data to clients."}
  ]}
];

await mongoose.connect(process.env.MONGODB_URI);
await Promise.all([
  Language.deleteMany({}), Lesson.deleteMany({}), Quiz.deleteMany({})
]);
await Language.insertMany(languages);
await Lesson.insertMany(lessons);
await Quiz.insertMany(quizzes);
console.log(`Seeded ${languages.length} languages, ${lessons.length} lessons, and ${quizzes.length} quizzes.`);
await mongoose.disconnect();
