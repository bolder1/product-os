-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS age;

-- Load AGE
LOAD 'age';
SET search_path = ag_catalog, "$user", public;

-- Create the product graph
SELECT create_graph('product_graph');

-- Create vertex labels
SELECT create_vlabel('product_graph', 'Product');
SELECT create_vlabel('product_graph', 'Plan');
SELECT create_vlabel('product_graph', 'TemplateBundle');
SELECT create_vlabel('product_graph', 'Module');
SELECT create_vlabel('product_graph', 'Feature');
SELECT create_vlabel('product_graph', 'Journey');
SELECT create_vlabel('product_graph', 'Page');
SELECT create_vlabel('product_graph', 'Route');
SELECT create_vlabel('product_graph', 'Screen');
SELECT create_vlabel('product_graph', 'Workflow');
SELECT create_vlabel('product_graph', 'Entity');
SELECT create_vlabel('product_graph', 'Field');
SELECT create_vlabel('product_graph', 'Component');
SELECT create_vlabel('product_graph', 'Variant');
SELECT create_vlabel('product_graph', 'Token');
SELECT create_vlabel('product_graph', 'Asset');
SELECT create_vlabel('product_graph', 'Task');
SELECT create_vlabel('product_graph', 'Approval');
SELECT create_vlabel('product_graph', 'Insight');
SELECT create_vlabel('product_graph', 'Release');
SELECT create_vlabel('product_graph', 'ConnectorBinding');
SELECT create_vlabel('product_graph', 'McpBinding');
SELECT create_vlabel('product_graph', 'SkillAction');
SELECT create_vlabel('product_graph', 'ComputerAction');

-- Create edge labels
SELECT create_elabel('product_graph', 'CONTAINS');
SELECT create_elabel('product_graph', 'DEPENDS_ON');
SELECT create_elabel('product_graph', 'REFERENCES');
SELECT create_elabel('product_graph', 'IMPLEMENTS');
SELECT create_elabel('product_graph', 'INHERITS');
SELECT create_elabel('product_graph', 'TRIGGERS');
SELECT create_elabel('product_graph', 'ROUTES_TO');
SELECT create_elabel('product_graph', 'USES_TOKEN');
SELECT create_elabel('product_graph', 'USES_COMPONENT');
SELECT create_elabel('product_graph', 'ASSIGNED_TO');
SELECT create_elabel('product_graph', 'APPROVES');
SELECT create_elabel('product_graph', 'BLOCKS');
