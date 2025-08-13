import { Box, Text } from "ink";

export default function Index() {
  return (
    <Box flexDirection="column">
      <Text color="blue" bold>
        🎯 reval CLI v0.1.0
      </Text>
      <Text color="gray">
        A benchmark framework for evaluating LLM applications
      </Text>
      <Text></Text>

      <Text bold>Commands:</Text>
      <Text>
        <Text color="green">init</Text> Initialize a new reval project
      </Text>
      <Text>
        <Text color="green">run</Text> Execute a benchmark run
      </Text>
      <Text>
        <Text color="green">ui</Text> Start the web interface
      </Text>
      <Text>
        <Text color="green">list</Text> List recent benchmark runs
      </Text>
      <Text>
        <Text color="green">show</Text> Show details for a specific run
      </Text>
      <Text>
        <Text color="green">export</Text> Export run results to file
      </Text>
      <Text>
        <Text color="green">version</Text> Show version information
      </Text>
      <Text></Text>

      <Text bold>Database Commands:</Text>
      <Text>
        <Text color="cyan">db create</Text> Create a new database
      </Text>
      <Text>
        <Text color="cyan">db migrate</Text> Run database migrations
      </Text>
      <Text>
        <Text color="cyan">db studio</Text> Open Drizzle Studio
      </Text>
      <Text></Text>

      <Text bold>Quick Start:</Text>
      <Text color="blue">1. reval init </Text>
      <Text color="gray"># Initialize project</Text>
      <Text color="blue">2. reval run </Text>
      <Text color="gray"># Run your first benchmark</Text>
      <Text color="blue">3. reval list </Text>
      <Text color="gray"># View results</Text>
      <Text color="blue">4. reval ui </Text>
      <Text color="gray"># Explore in web interface</Text>
      <Text></Text>

      <Text color="gray">
        Run 'reval &lt;command&gt; --help' for detailed command usage
      </Text>
      <Text color="gray">Documentation: https://github.com/your-org/reval</Text>
    </Box>
  );
}
