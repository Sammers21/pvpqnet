import { useState } from 'react';
import { Button } from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';

const CopyButton = ({ content, children }: { content: string; children?: React.ReactNode }) => {
  const [showCopied, setShowCopied] = useState(false);

  const onCopyClick = () => {
    setShowCopied(true);
    navigator.clipboard.writeText(content);

    setTimeout(() => {
      setShowCopied(false);
    }, 1000);
  };

  return (
    <>
      {showCopied ? (
        <Button className="!text-xs" size="small" variant="text" color="success">
          Copied!
        </Button>
      ) : (
        <Button
          className="!text-xs"
          style={{ color: '#60A5FACC' }}
          size="small"
          variant="text"
          onClick={onCopyClick}
        >
          <ContentCopyIcon fontSize="small" className="!w-4 !h-4 mr-1" />
          {children}
        </Button>
      )}
    </>
  );
};

export default CopyButton;
