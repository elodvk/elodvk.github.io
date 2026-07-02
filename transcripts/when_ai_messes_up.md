# To Err is Algorithm: Case Studies Where AI Messed Up Big Time

[section:Introduction]

Hey everyone, welcome back. Today we're covering something a little different. We're going to talk about failure. Specifically, AI failure. And not the small stuff. We're talking about incidents that cost hundreds of millions of dollars, set legal precedents, and forced entire business units to shut down.

[pause:2]

AI gets a lot of hype, and honestly a lot of it is deserved. But these systems are only as good as the data they're trained on, the algorithms that govern them, and the guardrails that humans put around them. When those elements don't line up, things go sideways fast. Let's look at four real case studies.

[pause:2]

[section:Air Canada Chatbot]

## Case Study One: The Air Canada Chatbot Hallucination

So in late 2022, a customer named Jake Moffatt was dealing with a family loss. His grandmother had passed away, and he went to the Air Canada website to ask about bereavement fares. The AI chatbot told him, confidently, that he could book a flight at full price and then submit a request for a retroactive bereavement refund within 90 days.

[pause:1]

He trusted that information. He booked the flights. But when he applied for the refund, Air Canada's human representatives denied it. Their actual policy explicitly prohibited retroactive bereavement claims. The chatbot had made it up.

[pause:1.5]

Here's where it gets really interesting. Moffatt took Air Canada to tribunal, and the airline's defense was essentially that the chatbot was a separate legal entity. They argued it was the customer's job to double-check what the bot said against the static policy pages. The tribunal completely rejected that argument. They ruled that a company is responsible for all information on its website, whether it comes from a static page or an AI agent.

[pause:1]

The root cause here was hallucination. Large language models don't actually know facts. They predict the next most probable word. Without proper retrieval-augmented generation constraints, the bot was free to improvise on legally binding corporate policy. And that's a governance failure, not just a technical one.

[pause:2]

[section:Zillow Offers]

## Case Study Two: The Collapse of Zillow Offers

This one's a classic. Zillow launched their iBuyer program called Zillow Offers. The idea was simple. Use a machine learning algorithm, an advanced version of their Zestimate, to predict future home prices. Buy homes directly from sellers, do light renovations, and flip them for profit. All driven by algorithmic pricing.

[pause:1]

By late 2021, the whole thing collapsed. Zillow had purchased thousands of homes at prices way above their actual market value. They were forced to shut down the entire division, write down 881 million dollars in losses, and lay off 2,000 employees. That's about 25 percent of their workforce.

[pause:1.5]

So what went wrong? Three things. First, concept drift. The algorithm was trained on historical housing data, but the COVID pandemic introduced unprecedented volatility. The patterns the model learned no longer reflected reality.

[pause:1]

Second, adverse selection. The algorithm offered average market prices without physically inspecting the homes. Homeowners with hidden problems eagerly accepted because they knew the offer was higher than what a human inspector would pay. Homeowners with great properties went to the open market instead. So Zillow's portfolio filled up with overpriced, defective inventory.

[pause:1]

Third, and this is the big one, they removed human oversight entirely. They treated the AI as an autonomous decision-maker rather than an advisory tool. In pursuit of hyper-growth, they forgot that algorithms need guardrails.

[pause:2]

[section:Google Gemini]

## Case Study Three: Google Gemini's Historical Overcorrection

In February 2024, Google launched image generation in Gemini. Almost immediately, people noticed something bizarre. If you asked for images of 1943 German soldiers, you'd get images of Black and Asian individuals in Nazi uniforms. Prompts for the U.S. Founding Fathers returned diverse groups of women and people of color. The model refused to generate images of Caucasian people in historically accurate contexts.

[pause:1.5]

The backlash was intense. Google had to completely suspend Gemini's ability to generate images of people. Their stock took a hit. It became a massive PR crisis about AI competency.

[pause:1]

The root cause was algorithmic overcorrection. Historically, AI image models default to generating white males for neutral prompts like doctor or CEO, because of imbalances in training data. To fix that, Google's engineers added diversity filters that secretly modified prompts to ensure diverse outputs. But the implementation was a blunt instrument. It applied the diversity mandate to everything, including specific historical events where it produced factually inaccurate and offensive results. It was a well-intentioned solution that lacked contextual nuance.

[pause:2]

[section:Tokenmaxxing]

## Case Study Four: The 500 Million Dollar Tokenmaxxing Bill

This one is from 2026. An unnamed enterprise company racked up a 500 million dollar API bill for Anthropic's Claude AI in a single month. They had rolled out agentic AI workflows and automated coding tools across their engineering teams, but completely failed to implement basic controls. No spending caps. No usage alerts. No daily token limits.

[pause:1.5]

The bill triggered a massive internal audit and became the poster child for what analysts are calling the AI spending reckoning. It forced boards across corporate America to panic-audit their own AI costs. The conversation shifted from how do we implement AI as fast as possible to how do we stop AI from bankrupting us.

[pause:1]

This wasn't an algorithmic failure. It was a system architecture and cultural failure. Employees were incentivized to use AI tools heavily, but nobody gave them visibility into the cost. When you give people a tool that charges money every time they press enter, and you tie their performance reviews to usage, without any spending limits, the result is financial ruin. The AI did exactly what it was asked. The humans forgot to put a cap on the corporate credit card.

[pause:2]

[section:Takeaway]

## The Takeaway

So what's the pattern here? In every single case, the AI didn't suddenly become malicious or go rogue. It failed because of the environment it was placed in. Hallucinating policy because there were no retrieval guardrails. Overpaying for homes because nobody checked the algorithm against reality. Producing offensive images because filters were applied without context. Running up insane costs because nobody set a spending limit.

[pause:1]

The lesson is clear. AI systems are powerful tools, but they are mathematically blind to the real-world consequences of their outputs. Until we learn to implement rigorous testing, continuous monitoring, and common-sense human-in-the-loop safeguards, these kinds of failures will keep happening.

[pause:1.5]

That's it for today. If you're deploying AI in your organization, take these case studies seriously. Test your guardrails. Monitor your costs. And never let an algorithm make high-stakes decisions without human oversight. Stay safe out there.
