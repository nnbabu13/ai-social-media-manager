DELETE FROM business_interview_messages
WHERE role = 'assistant'
  AND (
    content LIKE '%think%'
    OR content LIKE '%I need to%'
    OR content LIKE '%I should%'
    OR content LIKE '%Draft:%'
    OR content LIKE '%Reasoning:%'
    OR content LIKE '%Analysis:%'
    OR length(content) > 500
  );
