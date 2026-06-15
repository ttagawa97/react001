import { Box, FormControl, FormLabel, Input, Select, Textarea } from '@chakra-ui/react'

export function FilterPanel({ children }) {
  return (
    <Box
      className="filter-panel"
      as="section"
      bg="rgba(18, 27, 43, 0.9)"
      border="1px solid"
      borderColor="whiteAlpha.200"
      boxShadow="0 18px 55px rgba(0, 0, 0, 0.22)"
      backdropFilter="blur(18px)"
    >
      {children}
    </Box>
  )
}

export function SelectField({ label, value, onChange, children, disabled = false, formControlProps }) {
  return (
    <FormControl {...formControlProps}>
      <FormLabel m="0" color="gray.400" fontSize="xs" fontWeight="700">{label}</FormLabel>
      <Select
        disabled={disabled}
        value={value}
        bg="whiteAlpha.100"
        borderColor="whiteAlpha.300"
        borderRadius="16px"
        onChange={(event) => onChange(event.target.value)}
      >
        {children}
      </Select>
    </FormControl>
  )
}

export function InputField({ label, type, defaultValue, value, onChange, disabled = false, name, formControlProps }) {
  const controlledProps = value === undefined
    ? { defaultValue }
    : { value, onChange: (event) => onChange?.(event.target.value) }

  return (
    <FormControl {...formControlProps}>
      <FormLabel m="0" color="gray.400" fontSize="xs" fontWeight="700">{label}</FormLabel>
      <Input
        disabled={disabled}
        name={name}
        type={type}
        bg="whiteAlpha.100"
        borderColor="whiteAlpha.300"
        borderRadius="16px"
        {...controlledProps}
      />
    </FormControl>
  )
}

export function TextareaField({ label, defaultValue, name }) {
  return (
    <FormControl>
      <FormLabel m="0" color="gray.400" fontSize="xs" fontWeight="700">{label}</FormLabel>
      <Textarea
        defaultValue={defaultValue}
        name={name}
        minH="120px"
        bg="whiteAlpha.100"
        borderColor="whiteAlpha.300"
        borderRadius="16px"
      />
    </FormControl>
  )
}
