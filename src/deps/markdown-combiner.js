// Markdown file combiner utility

// Helper to parse markdown content and extract sections by headers
const parseMarkdownSections = (content) => {
  const lines = content.split('\n');
  const sections = new Map();
  let currentHeader = null;
  let currentContent = [];
  
  for (const line of lines) {
    // Check if line is a header (starts with #)
    const headerMatch = line.match(/^(#{1,6})\s+(.+)$/);
    
    if (headerMatch) {
      // Save previous section if exists
      if (currentHeader !== null) {
        const existing = sections.get(currentHeader) || [];
        sections.set(currentHeader, [...existing, currentContent.join('\n')]);
      }
      
      // Start new section
      currentHeader = headerMatch[2].trim(); // Header text without #
      currentContent = [];
    } else {
      // Add line to current section
      currentContent.push(line);
    }
  }
  
  // Save last section
  if (currentHeader !== null) {
    const existing = sections.get(currentHeader) || [];
    sections.set(currentHeader, [...existing, currentContent.join('\n')]);
  }
  
  return sections;
};

// Helper to determine header level from original content
const getHeaderLevel = (content, headerText) => {
  const lines = content.split('\n');
  for (const line of lines) {
    const headerMatch = line.match(/^(#{1,6})\s+(.+)$/);
    if (headerMatch && headerMatch[2].trim() === headerText) {
      return headerMatch[1].length; // Number of # characters
    }
  }
  return 1; // Default to h1 if not found
};

// Main function to combine markdown files
export const combineMarkdownFiles = (markdownContents) => {
  if (!Array.isArray(markdownContents) || markdownContents.length === 0) {
    return { error: "Please provide an array of markdown content strings" };
  }
  
  // Parse all files and collect sections
  const allSections = new Map();
  const headerLevels = new Map();
  
  for (const content of markdownContents) {
    if (typeof content !== 'string') {
      return { error: "All markdown contents must be strings" };
    }
    
    const sections = parseMarkdownSections(content);
    
    for (const [header, contentArray] of sections) {
      // Store header level from first occurrence
      if (!headerLevels.has(header)) {
        headerLevels.set(header, getHeaderLevel(content, header));
      }
      
      // Combine content from multiple files
      const existing = allSections.get(header) || [];
      allSections.set(header, [...existing, ...contentArray]);
    }
  }
  
  // Build combined markdown
  let combinedMarkdown = '';
  
  for (const [header, contentArray] of allSections) {
    const level = headerLevels.get(header);
    const headerPrefix = '#'.repeat(level);
    
    combinedMarkdown += `${headerPrefix} ${header}\n\n`;
    
    // Add all content for this header, separated by newlines
    for (let i = 0; i < contentArray.length; i++) {
      const content = contentArray[i].trim();
      if (content) {
        combinedMarkdown += content;
        if (i < contentArray.length - 1) {
          combinedMarkdown += '\n\n';
        }
      }
    }
    
    combinedMarkdown += '\n\n';
  }
  
  return {
    combined: combinedMarkdown.trim(),
    headerCount: allSections.size,
    message: `Successfully combined ${markdownContents.length} files with ${allSections.size} unique headers`
  };
};

// Helper function to combine markdown files from file paths (for Node.js environments)
export const combineMarkdownFromFiles = async (filePaths) => {
  if (typeof window !== 'undefined') {
    return { error: "File reading not supported in browser environment. Use combineMarkdownFiles with content strings instead." };
  }
  
  try {
    const fs = await import('fs');
    const contents = [];
    
    for (const filePath of filePaths) {
      const content = fs.readFileSync(filePath, 'utf8');
      contents.push(content);
    }
    
    return combineMarkdownFiles(contents);
  } catch (error) {
    return { error: `Failed to read files: ${error.message}` };
  }
};