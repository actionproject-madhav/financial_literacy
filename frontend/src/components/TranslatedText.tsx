/**
 * Component that automatically translates text content
 * Usage: <TranslatedText>Hello World</TranslatedText>
 */

import { useTranslateContent } from '../hooks/useTranslateContent'

interface TranslatedTextProps {
  children: string
  context?: string
  className?: string
  as?: 'p' | 'span' | 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'div'
}

export const TranslatedText = ({ 
  children, 
  context, 
  className = '',
  as: Component = 'span'
}: TranslatedTextProps) => {
  const { translated, isTranslating } = useTranslateContent(children, context)
  
  return (
    <Component className={className}>
      {isTranslating ? children : translated}
    </Component>
  )
}

