import { Button, Container, Section, SectionContent, Stack, Typography } from '@nobs/ui'

interface PageCrashProps {
  message: string
  /** Titled groups of monospaced lines (stack, components, recent log). */
  groups: readonly { title: string; lines: readonly { key: string; text: string }[] }[]
  onRetry: () => void
}

/** Shown in place of a page that crashed: the error on screen, as the sim has no console. */
export function PageCrash(props: PageCrashProps) {
  const { message, groups, onRetry } = props

  return (
    <Container maxWidth={false} fill>
      <Section label="This page crashed">
        <SectionContent>
          <Typography color="danger" mono>
            {message}
          </Typography>
          <Typography variant="caption" color="dim">
            Take a screenshot of this for the developer, then try again.
          </Typography>
          <Button variant="soft" onClick={onRetry}>
            Try again
          </Button>
          {groups.map((group) => (
            <Stack key={group.title} gap={1}>
              <Typography variant="label" color="dim">
                {group.title}
              </Typography>
              {group.lines.map((line) => (
                <Typography key={line.key} variant="caption" mono>
                  {line.text}
                </Typography>
              ))}
            </Stack>
          ))}
        </SectionContent>
      </Section>
    </Container>
  )
}
