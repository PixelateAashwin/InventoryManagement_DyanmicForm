
# Course Registration Form - Framer Embed Guide

This guide explains how to embed the course registration form into your Framer website.

## Method 1: Embed using HTML Embed Element (Recommended)

1. In your Framer project, add an "HTML Embed" element where you want the form to appear
2. Set the embed code to:

```html
<div id="form-embed-container" style="width: 100%; height: 100%;"></div>
<script src="https://your-deployed-app-url.com/embed.js"></script>
<script>
  // Initialize the form (optional configuration)
  document.addEventListener('DOMContentLoaded', function() {
    if (window.FormEmbed) {
      window.FormEmbed.init({
        // Optional: override the Pabbly webhook URL
        // pabblyWebhookUrl: 'https://your-custom-pabbly-webhook.com',
        
        // Optional: override the inventory API URL (Google Apps Script web app)
        // inventoryApiUrl: 'https://script.google.com/macros/s/YOUR_CUSTOM_SCRIPT_ID/exec',
        
        // Optional: use a different container selector (default is '#form-embed-container')
        // containerSelector: '#my-custom-container'
      });
    }
  });
</script>
```

3. Adjust the width and height of the HTML Embed element in Framer to control the size of the form

## Method 2: Embed using iFrame

1. Deploy your form application to a hosting service
2. In Framer, add an "Embed" element
3. Set the embed source to your deployed application URL
4. Adjust the size and position as needed

## Method 3: Direct Integration with Code Overrides

For advanced users who want to directly integrate with Framer's code:

1. Copy the built JS/CSS files to your Framer project's `/public` folder
2. Add the following code to your Framer page using the "Code" override:

```jsx
import { useEffect } from "react";

export function MyFramerComponent() {
  useEffect(() => {
    // Load the form script
    const script = document.createElement("script");
    script.src = "/embed.js"; // Assuming you placed it in the public folder
    script.async = true;
    document.body.appendChild(script);
    
    // Initialize when loaded
    script.onload = () => {
      if (window.FormEmbed) {
        window.FormEmbed.init();
      }
    };
    
    return () => {
      document.body.removeChild(script);
    };
  }, []);
  
  return <div id="form-embed-container" style={{ width: "100%", height: "600px" }} />;
}
```

## Building for Framer Integration

To build the embeddable version:

1. Run `npm run build` to create a production build
2. The `dist/embed.js` file will be created as a standalone bundle
3. Host this file on your server or CDN
4. Use the hosted URL in your Framer embed

## Customizing the Form Style

The form automatically inherits most styles from your Framer site. For additional customization:

1. Add custom CSS in your Framer site that targets the form elements
2. When initializing the form, you can pass additional CSS classes

## Troubleshooting

- If the form doesn't appear, check browser console for errors
- Ensure the container element exists before the script runs
- For CORS issues, make sure your API endpoints allow requests from your Framer domain
