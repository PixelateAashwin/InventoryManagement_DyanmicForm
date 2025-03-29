
import React from 'react';
import { createRoot } from 'react-dom/client';
import ContactForm from './components/ContactForm';
import { configureEmbed } from './lib/api';
import './index.css';

// Define interface for configuration
interface FormEmbedConfig {
  pabblyWebhookUrl?: string;
  inventoryApiUrl?: string;
  containerSelector?: string;
  adminMode?: boolean;
}

// Define the global FormEmbed interface
declare global {
  interface Window {
    FormEmbed: {
      init: (config?: FormEmbedConfig) => void;
      createFormContainer: () => HTMLElement;
    };
  }
}

// Function to create container element if needed
const createFormContainer = () => {
  let container = document.querySelector('#form-embed-container');
  
  if (!container) {
    container = document.createElement('div');
    container.id = 'form-embed-container';
    document.body.appendChild(container);
  }
  
  return container as HTMLElement;
};

// Initialize the form embed
const initFormEmbed = (config: FormEmbedConfig = {}) => {
  // Configure the API with any custom endpoints
  configureEmbed(config);
  
  // Find container element
  const containerSelector = config.containerSelector || '#form-embed-container';
  const container = document.querySelector(containerSelector);
  
  if (!container) {
    console.error(`Form embed container not found: ${containerSelector}. Make sure to add a div with this ID to your page.`);
    return;
  }
  
  // Create a div for the form if it doesn't exist
  let formRoot = container.querySelector('#form-embed-root');
  
  if (!formRoot) {
    formRoot = document.createElement('div');
    formRoot.id = 'form-embed-root';
    container.appendChild(formRoot);
  }
  
  // Create wrapper component to apply styles correctly
  const FormEmbedComponent = () => {
    return (
      <div className="form-embed-wrapper font-sans text-gray-900">
        <ContactForm />
      </div>
    );
  };
  
  // Render the form
  const root = createRoot(formRoot);
  root.render(<FormEmbedComponent />);
  
  // Broadcast event that form has been initialized
  window.dispatchEvent(new CustomEvent('form-embed-initialized'));
};

// Expose the init function globally
window.FormEmbed = {
  init: initFormEmbed,
  createFormContainer: createFormContainer
};

// Auto-initialize if the container exists
document.addEventListener('DOMContentLoaded', () => {
  if (document.querySelector('#form-embed-container')) {
    initFormEmbed();
  }
});

// Export for direct imports
export { initFormEmbed };

// Also export the container creation function
export { createFormContainer };
