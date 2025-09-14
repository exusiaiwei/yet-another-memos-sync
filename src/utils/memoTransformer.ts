import { Memo, Resource, DailyMemo } from '../types';
import { getTimeEmoji } from './timeEmoji';

/**
 * Generate resource link for attachment
 */
export function generateResourceLink(resource: Resource): string {
  if (!resource.externalLink) {
    return `![[${generateResourceName(resource)}]]`;
  }
  const prefix = resource.type?.includes("image") ? "!" : "";
  return `${prefix}[${resource.name || resource.filename}](${resource.externalLink})`;
}

/**
 * Generate safe filename for resource
 */
export function generateResourceName(resource: Resource): string {
  return `${resource.id}-${resource.filename?.replace(/[/\\?%*:|"<>]/g, "-")}`;
}

/**
 * Get callout type based on hour
 */
export function getCalloutType(hour: number): string {
  if (hour >= 5 && hour < 12) return 'info';    // 早晨 (蓝色)
  if (hour >= 12 && hour < 17) return 'tip';    // 中午 (绿色)
  if (hour >= 17 && hour < 21) return 'warning'; // 傍晚 (橙色)
  return 'note';                                  // 夜晚 (紫色)
}

/**
 * Get time period name for callout
 */
export function getTimePeriod(hour: number): string {
  if (hour >= 5 && hour < 12) return '早晨';
  if (hour >= 12 && hour < 17) return '中午';
  if (hour >= 17 && hour < 21) return '傍晚';
  return '夜晚';
}

/**
 * Get enhanced emoji for List Callout format
 * Simplified 4-period system that works perfectly with List Callouts plugin
 */
export function getListCalloutEmoji(hour: number): string {
  if (hour >= 5 && hour < 12) return '🌅';   // 早晨 (蓝色主题)
  if (hour >= 12 && hour < 17) return '☀️';  // 中午 (绿色主题)
  if (hour >= 17 && hour < 21) return '🌆';  // 傍晚 (橙色主题)
  return '🌙';                                // 夜晚 (紫色主题)
}

/**
 * Transform API memo to markdown format with emoji enhancement
 */
export function transformMemoToMarkdown(memo: Memo, useCalloutFormat = false, useListCalloutFormat = false): DailyMemo {
  const { timestamp, content, resources } = memo;

  // Validate timestamp
  if (typeof timestamp !== 'number' || !isFinite(timestamp) || timestamp <= 0) {
    throw new Error(`Invalid timestamp: ${timestamp}`);
  }

  // Use window.moment for Obsidian compatibility
  const momentDate = window.moment(timestamp * 1000);
  if (!momentDate.isValid()) {
    throw new Error(`Timestamp produces invalid date: ${timestamp}`);
  }

  const date = momentDate.format("YYYY-MM-DD");
  const time = momentDate.format("HH:mm");
  const hour = momentDate.hour();

  // Use enhanced emoji for List Callout format
  const emoji = useListCalloutFormat ? getListCalloutEmoji(hour) : getTimeEmoji(hour);

  // Use callout format if enabled
  if (useCalloutFormat) {
    const calloutType = getCalloutType(hour);
    const timePeriod = getTimePeriod(hour);

    // Process content for callout format - ensure each line has proper ">" prefix
    const contentLines = content.trim().split("\n");
    const processedContent = contentLines
      .map(line => line.trim())
      .filter(line => line.length > 0)
      .map(line => `> ${line}`)
      .join("\n");

    // Add resources if any
    const resourceLines = resources?.length ?
      "\n>\n" + resources.map(resource => `> ${generateResourceLink(resource)}`).join("\n") : "";

    // Create callout with proper formatting and extra newline for separation
    const finalContent = `> [!${calloutType}] ${emoji} ${time} - ${timePeriod}\n${processedContent}${resourceLines}\n> \n> ^${timestamp}\n`;

    return {
      date,
      timestamp: String(timestamp),
      content: finalContent
    };
  }  // List Callout format - merge multiple lines with spaces for better visual effect
  if (useListCalloutFormat) {
    // For List Callout format, merge all lines with spaces to maintain background color
    const mergedContent = content.trim().replace(/\n+/g, ' ').replace(/\s+/g, ' ');
    
    const [firstLine, ...otherLines] = [mergedContent]; // Since it's now a single line
    const taskMatch = firstLine.match(/(- \[.?\])(.*)/);

    let targetFirstLine = "";

    if (taskMatch) {
      targetFirstLine = `${taskMatch[1]} ${emoji} ${time} ${taskMatch[2]}`;
    } else {
      targetFirstLine = `- ${emoji} ${time} ${firstLine.replace(/^- /, "")}`;
    }

    targetFirstLine += ` #daily-record ^${timestamp}`;

    // No additional lines needed since content is merged
    const targetResourceLines = resources?.length ?
      "\n" + resources.map(resource => `  - ${generateResourceLink(resource)}`).join("\n") : "";

    const finalContent = targetFirstLine + targetResourceLines;

    return {
      date,
      timestamp: String(timestamp),
      content: finalContent
    };
  }
  
  // Original list format
  const [firstLine, ...otherLines] = content.trim().split("\n");
  const taskMatch = firstLine.match(/(- \[.?\])(.*)/);
  const isCode = /```/.test(firstLine);

  let targetFirstLine = "";

  if (taskMatch) {
    targetFirstLine = `${taskMatch[1]} ${emoji} ${time} ${taskMatch[2]}`;
  } else if (isCode) {
    targetFirstLine = `- ${emoji} ${time}`;
    otherLines.unshift(firstLine);
  } else {
    targetFirstLine = `- ${emoji} ${time} ${firstLine.replace(/^- /, "")}`;
  }

  targetFirstLine += ` #daily-record ^${timestamp}`;

  // Process multi-line content properly
  const targetOtherLines = otherLines?.length ?
    "\n" + otherLines
      .filter(line => line.trim())
      .map(line => `  ${line}`) // Use two spaces for proper indentation
      .join("\n") : "";

  const targetResourceLines = resources?.length ?
    "\n" + resources.map(resource => `  - ${generateResourceLink(resource)}`).join("\n") : "";

  const finalContent = targetFirstLine + targetOtherLines + targetResourceLines;

  return {
    date,
    timestamp: String(timestamp),
    content: finalContent
  };
}
