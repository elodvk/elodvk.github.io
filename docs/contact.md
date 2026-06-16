---
title: Contact Me
description: Get in touch securely.
---

# Let's Talk Security

Whether you have a question about a walkthrough, want to discuss a potential project, or just want to connect, feel free to send me a message! Your message will be sent securely to my private database.

<div style="max-width: 600px; margin-top: 2rem;">
  <form id="ps-contact-form" onsubmit="window.submitContact(event)" style="display: flex; flex-direction: column; gap: 1rem; background: var(--md-default-bg-color); padding: 1.5rem; border: 1px solid var(--md-default-fg-color--lightest); border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
    
    <div style="display: flex; gap: 1rem;">
      <div style="flex: 1; display: flex; flex-direction: column; gap: 0.3rem;">
        <label for="contact-name" style="font-size: 0.85rem; font-weight: 600; color: var(--md-default-fg-color);">Name</label>
        <input type="text" id="contact-name" required placeholder="John Doe" style="padding: 0.6rem; border-radius: 4px; border: 1px solid var(--md-default-fg-color--lightest); background: transparent; color: var(--md-default-fg-color); outline: none;">
      </div>
      <div style="flex: 1; display: flex; flex-direction: column; gap: 0.3rem;">
        <label for="contact-email" style="font-size: 0.85rem; font-weight: 600; color: var(--md-default-fg-color);">Email</label>
        <input type="email" id="contact-email" required placeholder="john@example.com" style="padding: 0.6rem; border-radius: 4px; border: 1px solid var(--md-default-fg-color--lightest); background: transparent; color: var(--md-default-fg-color); outline: none;">
      </div>
    </div>
    
    <div style="display: flex; flex-direction: column; gap: 0.3rem;">
      <label for="contact-message" style="font-size: 0.85rem; font-weight: 600; color: var(--md-default-fg-color);">Message</label>
      <textarea id="contact-message" required placeholder="How can I help you?" rows="5" style="padding: 0.6rem; border-radius: 4px; border: 1px solid var(--md-default-fg-color--lightest); background: transparent; color: var(--md-default-fg-color); outline: none; resize: vertical; font-family: inherit;"></textarea>
    </div>
    
    <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 0.5rem;">
      <div id="contact-status" style="font-size: 0.85rem; font-weight: 500;"></div>
      <button type="submit" id="contact-submit-btn" style="padding: 0.6rem 1.5rem; border: none; border-radius: 4px; background: var(--md-accent-fg-color); color: #fff; font-weight: bold; cursor: pointer; transition: opacity 0.2s;">Send Message</button>
    </div>
    
  </form>
</div>
