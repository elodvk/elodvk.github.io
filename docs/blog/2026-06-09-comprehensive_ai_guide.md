---
title: "A Comprehensive Guide to Modern AI: Concepts, Architecture, and Local Deployment"
date: 2026-06-09
authors:
  name: Bilash J. Shahi
  title: Cybersecurity enthusiast
  picture: https://avatars.githubusercontent.com/elodvk
  url: https://purplesec.org
tags:
  - AI
  - Machine Learning
  - Large Language Models
  - RAG
  - Local AI
---

The landscape of Artificial Intelligence has shifted rapidly from academic research to practical, everyday applications. If you are trying to navigate the current AI ecosystem, the sheer volume of technical terminology can be overwhelming. 

This guide breaks down the core components of modern AI, explaining not just what these technologies are, but how they interact, how you can run them on your own hardware, and the practical risks involved.

---

## 1. The Core Architecture: AI, ML, and LLMs

To understand the ecosystem, we first need to establish the hierarchy of the technology.

* **Artificial Intelligence (AI):** The broadest category, referring to any computer system designed to perform tasks that typically require human cognitive function.
* **Machine Learning (ML):** A subset of AI where systems learn patterns from data rather than being explicitly programmed with rules. 
* **Large Language Models (LLMs):** A specific type of machine learning model built on an architecture called a "transformer." LLMs (like GPT-4, Claude 3, or Llama 3) are trained on massive datasets of text to understand and generate human language. 

At a fundamental level, an LLM performs **next-token prediction**. A "token" is a fragment of a word (typically 3-4 characters in English). When you give an LLM a prompt, it calculates the mathematical probability of which token should come next, generating responses one token at a time.

## 2. Sizing the Brain: Parameters and Context Windows

When comparing different LLMs, two metrics primarily dictate their capability and hardware requirements.

### Model Parameters
Parameters are the internal variables (often represented as weights and biases) that the neural network uses to make decisions. During the training process, the model adjusts these parameters to learn the relationships between concepts.
* **Small Models (7B - 8B parameters):** Highly efficient. They can run on consumer laptops and are excellent for specific, focused tasks like text summarization or code completion.
* **Large Models (70B - 400B+ parameters):** Highly capable but resource-intensive. They possess deep domain knowledge, can handle complex logical reasoning, and generally require enterprise-grade server hardware to run effectively.

### The Context Window
The context window is the model’s active working memory during a single session, measured in tokens. If a model has a context window of 8,000 tokens (roughly 6,000 words), it can only "see" that amount of text at one time. 

If your conversation exceeds the context window, the model begins to forget the earliest parts of the prompt. Modern architectural advancements have pushed context windows from 4,000 tokens up to 2 million tokens, allowing users to input entire codebases or multiple textbooks into a single prompt.

## 3. Teaching the Model: Training, Fine-Tuning, and RAG

How does an AI actually get its information? There are three distinct phases or methods for giving an AI knowledge.

### Pre-Training
This is the initial, highly expensive phase where a model learns the fundamental structure of language, logic, and general world knowledge by processing trillions of words from the public internet. This creates the "base model." 

### Fine-Tuning
Base models are often unwieldy and just want to complete text (if you prompt a base model with "How do I bake a cake?", it might respond with "How do I bake a pie?"). **Instruction Fine-Tuning** trains the model on thousands of example interactions so it learns to behave like a helpful assistant that answers questions rather than just continuing sentences. 

### RAG (Retrieval-Augmented Generation)
Fine-tuning is too expensive to do every time your company updates a policy document. **RAG** solves this by connecting the LLM to an external database. 
1. The user asks a question.
2. A search system retrieves relevant documents from your private database.
3. The system feeds those specific documents into the LLM's context window.
4. The LLM reads the retrieved documents and formulates an accurate answer based *only* on that localized data.

## 4. The Machinery of RAG: Embeddings and Vector Databases

To make RAG work efficiently, the system needs a way to "understand" the meaning of your documents. It does this using embeddings.

**Embeddings** convert text into lists of numbers (vectors) that represent the *semantic meaning* of the text. For example, the words "dog" and "puppy" will have vectors that are mathematically very close to each other, even though they share no letters. 

These vectors are stored in a **Vector Database**. When a user asks a question, the system converts the question into a vector, mathematically measures which document vectors are closest to the question vector, and retrieves them. This allows the AI to search by *concept* rather than just keyword matching.

## 5. Running AI Locally: Taking Control of Your Data

Most people interact with AI through cloud APIs (like the ChatGPT interface), where the computation happens on distant servers. However, there is a massive movement toward **Local AI**—running these models entirely on your own hardware. 

Local AI offers absolute data privacy, offline capabilities, and zero subscription fees. But it requires specific hardware and software optimizations.

### The Hardware Bottleneck: VRAM
To run an LLM efficiently, the entire model must be loaded into the memory of your graphics card, known as **VRAM (Video Random Access Memory)**. Standard RAM is generally too slow for the massive parallel mathematical operations required by AI. A standard 8B parameter model typically requires at least 8GB of VRAM to run smoothly.

### Quantization and GGUF
To fit larger models onto standard consumer hardware, developers use **Quantization**. This is a compression technique that reduces the precision of the model's parameters. 

Parameters are usually stored as highly precise 16-bit decimal numbers. Quantization rounds them down to 8-bit or even 4-bit numbers. While this results in a very slight loss of reasoning capability, it drastically reduces the file size and VRAM requirements, allowing a massive model to run on a standard laptop.

**GGUF (GPT-Generated Unified Format)** is the standard file format for these quantized, locally optimized models. It packages the model weights, parameters, and necessary configuration into a single, easily downloadable file.

### Ollama: The Execution Engine
To run a GGUF file, you need inference software. **Ollama** has emerged as the industry standard for local deployment. It operates via a command-line interface, handles the allocation of hardware resources (seamlessly splitting the workload between your GPU and CPU if necessary), and creates a local API. This allows you to easily connect your locally running model to other applications or graphical user interfaces.

## 6. The Next Frontier: Agents and Tool Calling

LLMs traditionally output text. However, the ecosystem is rapidly shifting toward **AI Agents**. 

An agent is an LLM equipped with "tools." Instead of just generating text, the LLM is programmed to recognize when it needs external help. If you ask an agent, "What is the weather in Tokyo?", it won't hallucinate an answer. Instead, it will write a piece of code to query a live weather API, read the result, and then summarize that live data back to you. Agents can execute code, search the web, manage files, and interact with other software, moving AI from an encyclopedia to an active digital worker.

## 7. Risks and Limitations

While the capabilities are impressive, integrating AI into workflows requires a clear understanding of its structural flaws.

1.  **Hallucinations:** Because LLMs are fundamentally predictive engines, they are designed to be highly plausible, not definitively factual. When an LLM lacks information, it will often generate completely fabricated—but highly convincing—information to mathematically satisfy the prompt. 
2.  **The "Black Box" Problem:** Even the engineers who train the largest models do not fully understand the exact pathways the model takes to arrive at a specific conclusion. This lack of interpretability makes it difficult to guarantee reliability in high-stakes environments like healthcare or legal systems.
3.  **Data Bias:** LLMs are trained on human-generated data, meaning they absorb all the historical biases, stereotypes, and toxic viewpoints present on the internet. Without careful system prompting and safety guardrails, models can perpetuate these biases in their outputs.
4.  **Security Vulnerabilities:** As models gain agentic capabilities (tool calling), the risk profile increases. "Prompt Injection" is a technique where malicious users hide commands within text. If an AI agent reads a compromised document, it might be tricked into executing unauthorized commands, such as deleting files or exfiltrating data.
5.  **Environmental Impact:** Training a state-of-the-art LLM requires thousands of specialized GPUs running at maximum capacity for months. This consumes immense amounts of electricity and water (for cooling data centers), raising serious questions about the long-term ecological sustainability of the AI boom.

Understanding these concepts transitions you from a passive consumer of AI tools to an informed operator, capable of navigating the trade-offs between cloud convenience and local control, while maintaining a realistic view of the technology's limitations.