# Video Analysis

**URL**: https://www.youtube.com/watch?v=We7BZVKbCVw
**Processed**: 2026-02-21T16:24:33.112211
**Model**: gemini-3-pro-preview
**Usage**: 29,259 input + 4,396 output = 33,655 tokens
**Cost**: $0.080534 ($0.036574 input + $0.043960 output)

______________________________________________________________________

# Video Analysis: Principles for Building AI Products

## Video Information

| Field            | Value                                                                                                |
| ---------------- | ---------------------------------------------------------------------------------------------------- |
| **Title**        | Principles for Building AI Products: The Bitter Lesson & Future-Proofing                             |
| **Duration**     | 03:51                                                                                                |
| **Speaker(s)**   | **Lenny Rachitsky** (Host, Lenny's Podcast)<br>**Alex Albert** (Head of Claude Relations, Anthropic) |
| **Organization** | Lenny's Podcast / Anthropic                                                                          |
| **Topic**        | AI Product Development, LLM Strategy, The Bitter Lesson, Agentic AI                                  |

______________________________________________________________________

## Executive Summary

In this interview segment, Lenny Rachitsky asks Alex Albert (Anthropic) for advice on building products on top of Artificial Intelligence. Alex outlines three core principles for developers and founders. First, he advises against "boxing the model in" with strict, human-designed workflows. Instead, he suggests giving the model tools and a goal, allowing it to determine the best path, as modern models require less "scaffolding" than their predecessors.

Second, Alex references Rich Sutton's "The Bitter Lesson," arguing that general models will almost always outperform specific, fine-tuned, or hand-crafted systems over the long term. He suggests that gains made from complex scaffolding (10-20%) are often wiped out by the next generation of general models, making it smarter to bet on the general model.

Finally, Alex shares a strategic insight from the development of "Claude Code": build for the model that will exist in six months, not the model that exists today. He explains that early versions of their product were built on models that weren't yet capable enough, betting that by launch time, the underlying technology (specifically Opus 4/Sonnet 4 class models) would catch up. He concludes with a prediction that future models will be defined by their ability to use computers as tools and run unattended for extended periods (hours to days).

______________________________________________________________________

## Table of Contents

| Time    | Section                                       |
| ------- | --------------------------------------------- |
| [00:00] | Introduction: Context and Previous Tips       |
| [00:21] | Principle 1: Don't Box the Model In           |
| [01:17] | Principle 2: The Bitter Lesson                |
| [02:30] | Principle 3: Build for the Model 6 Months Out |
| [03:00] | Case Study: Developing Claude Code            |
| [03:54] | How Models Will Improve: Tool Use & Duration  |

______________________________________________________________________

## Detailed Content

### Introduction & Question [00:00 - 00:21]

**Summary**: Lenny sets the stage by recalling previous advice Alex gave (allowing teams unlimited tokens to experiment) and asks for further advice for builders in the AI space.

**Key Points**:

- Previous tip recap: Give teams unlimited tokens to foster experimentation.
- Previous tip recap: Build toward where the model is going, not where it is today.

**Transcript Excerpt**:

> "What other advice do you have for folks that are trying to build AI products?"

### Principle 1: Don't Box the Model In [00:21 - 01:17]

**Summary**: Alex warns against the instinct to force models into strict, linear workflows (Step 1, then Step 2). He argues that modern models perform better when given tools and a high-level goal, rather than a rigid process.

**Key Points**:

- **Avoid Over-Curation**: Don't layer strict workflows or fancy orchestrators on top of the model.
- **Tools over Scaffolding**: Give the model tools and a goal; let it figure out the execution.
- **Diminishing returns on scaffolding**: A year ago, scaffolding was necessary. Today, it is largely obsolete.
- **New Maxim**: "Ask not what the model can do for you... think about how do you give the model the tools to do things."

**Transcript Excerpt**:

> "Don't try to box the model in... almost always you get better results if you just give the model tools, you give it a goal, and you let it figure it out."

### Principle 2: The Bitter Lesson [01:17 - 02:30]

**Summary**: Alex applies Rich Sutton's computer science concept, "The Bitter Lesson," to AI product development. The lesson states that leveraging general computation (or in this case, a general model) eventually beats human domain knowledge or specific tweaks.

**Key Points**:

- **The Bitter Lesson**: A blog post by Rich Sutton (approx. 10 years old) positing that general methods usually outperform specific methods.
- **General vs. Specific**: Always bet on the more general model over the long term.
- **Fine-tuning warning**: Don't use tiny models or fine-tuning unless absolutely necessary for specific applications.
- **Scaffolding is temporary**: Scaffolding might yield a 10-20% gain, but the next model release usually renders that gain irrelevant.

**Transcript Excerpt**:

> "For me, the biggest one is just always bet on the more general model... don't try to use tiny models for stuff, don't try to fine-tune... almost always try to bet on the more general model if you can."

### Principle 3: Build for the Model 6 Months Out [02:30 - 03:54]

**Summary**: Alex explains a strategy used by the Claude Code team: designing the product based on the capabilities they expected models to have in the future, rather than what was currently available.

**Key Points**:

- **Strategic Bet**: Build for the model capabilities of 6 months from now.
- **Early struggles**: When building Claude Code, early models (Sonnet 3.5 era) were not good enough at coding; Alex didn't trust them to write his code.
- **The Inflection Point**: They saw a massive jump in capability with their internal "Opus 4" and "Sonnet 4" class models (ASL-3 class models).
- **Growth**: Product growth went exponential once the model capability caught up to the product vision.

**Transcript Excerpt**:

> "From the very beginning, we bet on building for the model six months from now, not for the model of today."

### Future Capabilities: Tool Use & Duration [03:54 - End]

**Summary**: Alex answers Lenny's follow-up on *how* models will get better. He predicts improvements in tool use (using computers) and the ability to maintain coherence over long durations.

**Key Points**:

- **Computer Use**: Models will get better at using computers as tools.
- **Duration**: Models will evolve from running for seconds to running for hours, days, or weeks unattended.
- **Evolution of reliability**: A year ago, models could run for 15-30 seconds before going "off the rails." Now (Opus 4.5/4.6 era implied), they can run 20-30 minutes unattended.
- **Agentic Future**: It will become normal to have multiple instances of models running for days at a time to complete complex tasks.

**Transcript Excerpt**:

> "Another one is it's going to get better and better for running for long periods of time... models are running for very, very long period of time... running for hours or even days at a time."

______________________________________________________________________

## All Visual Content with Speaker Notes

*Note: This video is a recorded interview with no slides, screen sharing, or overlay graphics. The visual content consists entirely of the two speakers in a split-screen format.*

### Visual 1: Split Screen Interview - [00:00 - End]

- **Type**: Live Video Feed
- **Left Screen**: Lenny Rachitsky. He is wearing a black v-neck t-shirt and large over-ear headphones. He is sitting in a room with a bookshelf and a painting behind him. There is a "fire" visual (likely a screen) in the background.
- **Right Screen**: Alex Albert. He is wearing a dark grey hoodie and white earbuds (AirPods). He has a light background, likely an office wall.
- **Overlay**: In the top right corner, there is a small logo of a "gnome/wizard" character (Lenny's Podcast logo).
- **Time Code**: There is a timestamp visible in the top left corner of the video file (starts at 1:03:21).
- **Speaker Notes (General)**: The speakers maintain eye contact with their cameras. Alex uses hand gestures to emphasize points about "boxing in" models and "scaffolding."

______________________________________________________________________

## Full Transcript

**[00:00]** **Lenny**: One more thing here. You shared some really cool tips for how to get the most out of AI, how to build on AI, how to build great products on AI. One tip you shared is: give your team as many tokens as they want, just like let them experiment. You also shared just advice generally of just build towards where the model is going, not to where it is today. What other advice do you have for folks that are trying to build AI products?

**[00:21]** **Alex**: I probably share a few more things. So one is, don't try to box the model in. I think a lot of people's instinct when they build on the model is they try to make it behave a very particular way. They're like, "this is a component of a bigger system." I think some examples of this are people layering like very strict workflows on the model, for example. You know, to say like, "you must do step one, then step two, then step three," and you have this like very fancy orchestrator doing this. But actually almost always you get better results if you just give the model tools, you give it a goal, and you let it figure it out.

**[00:52]** **Alex**: I think a year ago, you actually needed a lot of the scaffolding, but nowadays you don't really need it. So, you know, I don't know what to call this principle, but it's like, you know, like "ask not what the model can do for you." Maybe, maybe it's something like this. Just think about how do you give the model the tools to do things? Don't try to over-curate it. Don't try to put it into a box. Don't try to give it a bunch of context up front. Give it a tool so that it can get the context it needs. You're just going to get better results.

**[01:17]** **Alex**: I think a second one is, um, maybe actually like a more, even more general version of this principle is just "The Bitter Lesson." Uh, and actually for the Claude Code team we have a, you know, hopefully, hopefully, um, listeners have read this, but Rich Sutton had this blog post maybe 10 years ago called "The Bitter Lesson." Uh, and it's actually a really simple idea. His idea was that the more general model will always outperform the more specific model.

**[01:43]** **Alex**: And I think for him, he was talking about like self-driving cars and other domains like this. But actually there's just so many corollaries to The Bitter Lesson. And for me, the biggest one is just always bet on the more general model. And you know, over the long term. Like don't try to use tiny models for stuff. Don't try to fine-tune. Don't try to do any of this stuff. There's like some applications, you know, there's some reasons to do this, but almost always try to bet on the more general model if you can, if you have that flexibility.

**[02:09]** **Alex**: Um, and so these workflows are essentially a way that, uh, you know, it's not, it's not a general model. It's putting this scaffolding around it. And in general what we see is maybe scaffolding can improve performance maybe 10, 20%, something like this. But often these gains just get wiped out with the next model. Uh, so it's almost better to just wait for the next one.

**[02:30]** **Alex**: And I think maybe this is the final principle and something that Claude Code, I think got right in hindsight. From the very beginning, we bet on building for the model six months from now. Not for the model of today. And for the very early versions of the product, it just wrote so little of my code cause I didn't trust it. Cause, you know, it was like Sonnet 3.5, then it was like 3.6 or I forget, 3.5 New, whatever, whatever, whatever name we gave it. Um, these models just weren't very good at coding yet. Um, they were getting there, but it was still pretty early.

**[03:03]** **Alex**: So back then the model did, uh, you used git for me, it automated some things, but it really wasn't doing a huge amount of my coding. And so the bet with Claude Code was at some point the model gets good enough that it can just write a lot of the code. And this is a thing that we first started seeing with Opus 4 and Sonnet 4. And Opus 4 was our first kind of ASL-3 class model, uh, that we released back in May. And we just saw this inflection because everyone started to use Claude Code for the first time. And that was kind of when our growth really went exponential and like I said, it's kind of, it stayed there.

**[03:38]** **Alex**: So I think this is some, this is advice that I actually give to a lot of folks, especially people building startups. It's going to be uncomfortable because your product market fit won't be very good for the first six months. But if you build for the model six months out, when that model comes out, you're just going to hit the ground running and the product is going to click and start to work.

**[03:54]** **Lenny**: And when you say build for the model six months out, what is, what is it that you think people can assume will happen? Is it just generally it will get better at things? Is it just like, okay, it's like almost good enough and that's a sign that it'll probably get better at that thing? Is there any advice there?

**[04:08]** **Alex**: I think that's a good way to do it. Like, you know, obviously within an AI lab we get to see the specific ways that it gets better. So it's a, it's a little unfair. But we also, we try to talk about this. So, you know, like one of the ways that it's going to get better is it's going to get better and better using tools and using computers. This is a bet that I would make.

**[04:26]** **Alex**: Uh, another one is it's going to get better and better for running for long periods of time. And this applies, you know, like there's all sorts of studies about this, but if you just trace the trajectory or, you know, maybe even like for my own experience, when I used Sonnet 3.5 back, you know, a year ago, it could run for maybe 15 or 30 seconds before, before it started going off the rails. And you just really had to hold its hand through any kind of complicated task.

**[04:52]** **Alex**: But nowadays with Opus 4.6 (Note: speaker likely says Opus 4 or internal version), you know, on average it'll run maybe 10, 30, 20, 30 minutes unattended. And I'll just like start another Claude and have it do something else. And you know, like I said, I always have a bunch of Claudes running. Uh, and they can also run for hours or even days at a time. I think there were some examples where they ran for many weeks. And so I think over time this is going to become more and more normal where the models are running for a very, very long period of time and you don't have to sit there.

______________________________________________________________________

## Key Takeaways

### Main Lessons

1. **Reduce Scaffolding**: Modern models (like Sonnet 3.5/Opus 4) are intelligent enough to manage their own workflows. Rigid, human-designed steps often hinder performance compared to giving the model tools and a goal.
1. **The Bitter Lesson Applied to Product**: Investing heavily in fine-tuning or complex orchestration (scaffolding) usually only yields temporary gains (10-20%). These gains are consistently erased by the next generation of more general models.
1. **Build for the Future Model**: Startups should design products for the capabilities expected in 6 months, not today. This often means enduring a period of poor product-market fit (PMF) with the expectation that when the model capability arrives, the product will instantly "click."

### Actionable Advice

- [ ] **Audit your workflows**: Remove strict "Step 1, Step 2" constraints from your AI implementations.
- [ ] **Implement Tool Use**: Instead of giving the model all context upfront, give it tools (e.g., file readers, search) to fetch context as needed.
- [ ] **Bet on General Models**: Avoid fine-tuning or using "tiny" models for complex tasks; the general model trajectory is steeper and more reliable.
- [ ] **Design for Duration**: Prepare your user interface and infrastructure to handle AI agents that run for 30 minutes, hours, or days unattended, rather than just chat-response interactions.

### Memorable Quotes

> "Ask not what the model can do for you... Give it a tool so that it can get the context it needs." - **Alex Albert**

> "Scaffolding can improve performance maybe 10, 20%... but often these gains just get wiped out with the next model." - **Alex Albert**

> "It's going to be uncomfortable because your product market fit won't be very good for the first six months. But if you build for the model six months out, when that model comes out, you're just going to hit the ground running." - **Alex Albert**

______________________________________________________________________

## Resources Mentioned

| Resource                | Type            | Link/Reference                                  |
| ----------------------- | --------------- | ----------------------------------------------- |
| **The Bitter Lesson**   | Blog Post       | Written by Rich Sutton (referenced concept)     |
| **Claude Code**         | Product         | Anthropic's CLI tool (referenced as case study) |
| **Sonnet 3.5 / Opus 4** | AI Models       | Anthropic models mentioned as benchmarks        |
| **ASL-3**               | Safety Standard | AI Safety Level 3 (Referenced regarding Opus 4) |

______________________________________________________________________

## Glossary

| Term                  | Definition                                                                                                                                                                                     |
| --------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Scaffolding**       | The code, workflows, and strict logic wrapped around an AI model to force it to behave in a specific way (e.g., orchestrators).                                                                |
| **Orchestrator**      | A system that manages strict workflows, directing the AI to perform specific steps in a specific order.                                                                                        |
| **Fine-tuning**       | The process of training a pre-trained model on a smaller, specific dataset to specialize it for a task.                                                                                        |
| **The Bitter Lesson** | A principle by Rich Sutton stating that general methods that leverage computation (like search and learning) are ultimately more effective than methods relying on human knowledge/heuristics. |
| **ASL-3**             | AI Safety Level 3. A classification for models that require stringent security measures due to their capabilities.                                                                             |

______________________________________________________________________

## Related Topics

- **Agentic AI**: The shift from chatbots to AI that uses computers and tools autonomously over long periods.
- **Product Management for AI**: Strategies for timing product releases with model capability curves.
- **Prompt Engineering vs. Tool Use**: The transition from crafting prompts to designing tool interfaces for models.
