import React from "react";
import { Globe, Users, Lock } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

/**
 * PrivacyIndicator Component
 * Displays an icon and label indicating the privacy level of a post
 *
 * @param {Object} props - Component props
 * @param {string} props.privacy - Privacy level of the post ('public', 'friends', or 'private')
 * @returns {React.ReactElement}
 */
const PrivacyIndicator = ({ privacy }) => {
  let icon, label, description;

  switch (privacy) {
    case "private":
      icon = <Lock className="h-4 w-4 text-gray-500" />;
      label = "Private";
      description = "Only you can see this post";
      break;
    case "friends":
      icon = <Users className="h-4 w-4 text-gray-500" />;
      label = "Friends";
      description = "Only your friends can see this post";
      break;
    case "public":
    default:
      icon = <Globe className="h-4 w-4 text-gray-500" />;
      label = "Public";
      description = "Anyone can see this post";
      break;
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center space-x-1 cursor-help">
            {icon}
            <span className="text-xs text-gray-500">{label}</span>
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p>{description}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default PrivacyIndicator;
