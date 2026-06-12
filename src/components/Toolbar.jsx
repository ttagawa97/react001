import { Button, Flex, Heading, Text } from '@chakra-ui/react'

export function Toolbar({ title, action, detail = 'モックデータで画面構成を確認できます。', onAction, actionDisabled = false }) {
  return (
    <Flex
      className="toolbar"
      direction={{ base: 'column', lg: 'row' }}
      align={{ base: 'flex-start', lg: 'center' }}
      justify="space-between"
      gap="5"
    >
      <div>
        <Heading as="h2" size="md">{title}</Heading>
        <Text mt="1.5">{detail}</Text>
      </div>
      <Button type="button" onClick={onAction} isDisabled={actionDisabled}>{action}</Button>
    </Flex>
  )
}

export function PanelHeader({ title, detail }) {
  return (
    <Flex className="panel-header" align="flex-start" justify="space-between" gap="4">
      <div>
        <Heading as="h2" size="md">{title}</Heading>
        <Text mt="1.5">{detail}</Text>
      </div>
    </Flex>
  )
}
