# The Samy Worm: The Fastest-Spreading XSS Worm in History

[section:Introduction]

Alright everyone, buckle up because today we're talking about my favorite cybersecurity story of all time. It's 2005. A 19-year-old kid in Los Angeles is bored on MySpace and thinks to himself, you know what would be cool? If I had more friends. And not in the go-outside-and-socialize kind of way. In the write-some-JavaScript-and-hack-the-planet kind of way.

[pause:2]

What followed was the fastest-spreading virus in the history of the internet. Over one million infections in under 20 hours. No malware. No zero-day exploits. No email attachments. Just a few dozen lines of JavaScript, a bunch of clever filter bypasses, and the pure audacity of a teenager who really, really wanted to be popular.

[pause:1.5]

This is the story of the Samy worm. And honestly, it's the most entertaining cybersecurity incident I've ever researched.

[pause:2]

[section:Context]

## MySpace in 2005 — The Wild West

To appreciate this story, you need to understand what MySpace was in 2005. It wasn't just a website. It was THE internet. It surpassed Google as the most visited website in America. Your MySpace profile was your identity. Your top 8 friends list caused more drama than reality TV.

[pause:1]

And here's the critical detail. MySpace let you put custom HTML and CSS in your profile. Think about that. They literally said, here users, inject whatever code you want into pages that other people visit. What could possibly go wrong?

[pause:1]

There was no Content Security Policy. That wasn't even invented yet. Cross-site scripting was a known vulnerability class, sure, but nobody thought you could weaponize it at scale. It was considered a low-severity issue. The standard demo was just making an alert box pop up. Ooh scary, a popup. Nobody loses sleep over a popup.

[pause:1.5]

Well. Samy Kamkar was about to make the entire security industry lose a LOT of sleep.

[pause:2]

[section:The Attack]

## How It Actually Worked — Bypassing Everything

So MySpace wasn't completely naive. They did have filters. They stripped script tags. They blocked the word javascript. They removed event handlers. If you tried the obvious stuff, it got caught.

[pause:1]

But Samy found the cracks. And this is where it gets beautiful from a hacker's perspective.

[pause:1]

First, he discovered that Internet Explorer 6, which had 85% market share at the time, supported something called CSS expressions. This let you execute JavaScript inside a style attribute. MySpace's filter was looking for script tags, not for JavaScript hiding inside CSS. It's like checking someone's pockets at the door but not noticing the JavaScript taped to the inside of their hat.

[pause:1.5]

But MySpace also stripped the word javascript. So Samy did what any reasonable person would do. He put a newline in the middle of the word. Java, newline, script. Internet Explorer didn't care about the newline. It saw javascript just fine. But MySpace's text filter? It only matched the word as one continuous string. It literally couldn't see it because of a line break. I love this so much.

[pause:1]

Then MySpace stripped double quotes, which would break his JavaScript strings. Solution? Character codes. Instead of writing the word samy in quotes, he wrote String.fromCharCode 115, 97, 109, 121. No quotes needed.

[pause:1]

MySpace filtered the word innerHTML? He wrote inner plus HTML as a string concatenation in bracket notation. The filter never saw the complete word together.

[pause:1.5]

Every single restriction MySpace put up, Samy found a way around it using the most creative, scrappy techniques imaginable. It's like watching someone pick a lock with a piece of spaghetti.

[pause:2]

[section:Propagation]

## The Self-Replicating Part — Why It's a Worm

Here's what made this thing go nuclear. Once the JavaScript executed in your browser when you visited an infected profile, it did four things.

[pause:1]

One. It grabbed your authentication token from your own profile page. Same origin, so the browser happily handed it over.

Two. It sent a friend request from YOUR account to Samy Kamkar. That's how he got a million friends.

Three. It edited your profile to add the text "but most of all, samy is my hero." Just beautiful. Chef's kiss.

[pause:1]

And four. The critical part. It copied its OWN source code into YOUR profile. So now when someone visits your page, it happens to them too. And then their page infects the next person. And the next person. Exponential growth.

[pause:1.5]

The numbers were insane. One thousand infections in the first hour. 250,000 after eight hours. 500,000 after twelve hours. Over a million by hour twenty. The worm was adding a thousand friend requests per second to Samy's account at peak speed.

[pause:1]

For comparison, the ILOVEYOU worm from 2000, which caused ten billion dollars in damages, took TEN DAYS to hit fifty million computers. Samy hit a million in under a day. With JavaScript. On a social network. In 2005. While probably eating pizza.

[pause:2]

[section:Aftermath]

## The Aftermath — Secret Service, Probation, and No Internet

MySpace's response was to take the ENTIRE platform offline. The whole thing. Millions of users couldn't check their top 8 friends or listen to terrible auto-playing music. The horror.

[pause:1]

They scrubbed the worm from over a million profiles. They patched the CSS expression bypass. They deleted Samy's account. And then they called the Secret Service. Because apparently making yourself popular on the internet is a federal crime.

[pause:1.5]

Samy got hit with a felony charge. Three years of probation. Ninety days of community service. Restitution to MySpace. And here's the best part. He was banned from using the internet for three years. A three-year internet ban. In the 2000s. That's basically a prison sentence for a 19-year-old developer.

[pause:1]

Think about that punishment. He didn't steal anything. He didn't delete anyone's data. He didn't deploy malware. He literally just added himself as a friend and wrote "samy is my hero" on people's pages. And they banned him from the internet for three years. The Computer Fraud and Abuse Act is not messing around, folks.

[pause:2]

[section:Legacy]

## Why This Still Matters in 2026

You might think, okay, cool story from 2005, ancient history. But here's why the Samy worm still matters today.

[pause:1]

Before this worm, XSS was considered a joke vulnerability. Just makes popups, who cares. After this worm, the entire industry realized that stored XSS plus AJAX plus self-propagation equals a fully autonomous internet worm that requires zero user interaction beyond visiting a webpage. One click. That's all it takes.

[pause:1.5]

This incident directly accelerated Content Security Policy. HttpOnly cookies. Auto-escaping frameworks like React and Angular. The reason Facebook and Twitter don't let you put custom HTML in your profile? Because of what happened to MySpace. The entire architecture of modern social media was shaped by this 19-year-old's JavaScript prank.

[pause:1]

And here's the uncomfortable truth. XSS is STILL in the OWASP Top 10. In 2026. Twenty-one years later. We're still finding bypasses. We're still deploying broken CSPs. Google found that 94 percent of CSP deployments in the wild were bypassable. Ninety-four percent! The technology evolved. The fundamental lesson apparently didn't.

[pause:1.5]

The Samy worm was a warning shot. What if the payload had been malicious? What if instead of adding a friend, it stole session tokens? Harvested private messages? Deployed browser exploits? The same mechanism that spread "samy is my hero" to a million profiles could have compromised a million accounts. And in 2005, with Internet Explorer 6's security model, it could have installed actual malware on people's computers.

[pause:2]

[section:Closing]

## Final Thoughts

After probation, Samy Kamkar went on to become one of the most respected security researchers in the world. He built drones that hack other drones mid-flight. He built a 30-dollar device that clones car key fobs. He built a USB device that backdoors locked computers in seconds. The guy is genuinely brilliant.

[pause:1]

And it all started because he wanted more friends on MySpace. There's something poetic about that.

[pause:1]

The Samy worm taught us that web browsers are execution environments, that user-generated content is code injection waiting to happen, and that a single stored XSS vulnerability on a popular platform can have exponential, worm-like consequences.

[pause:1.5]

Twenty-one years later, samy is, in fact, still my hero. And if you're a web developer listening to this and you're not sanitizing user input, just know that somewhere out there, another 19-year-old is getting bored. And they want friends too. Stay safe out there everyone.
