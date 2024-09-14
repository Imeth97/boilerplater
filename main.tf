terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 4.16"
    }
  }

  required_version = ">= 1.2.0"
}

provider "aws" {
  region = "us-east-1" # region of the user account
}

# Creating an ECR Repository

resource "aws_ecr_repository" "nextjs14-ecr-repo" {
    name                 = "nextjs14-ecr-repo"
    image_tag_mutability = "MUTABLE"
    force_delete         = true

    image_scanning_configuration {
        scan_on_push = true
    }
}
# --- Build & push image ---

locals {
  repo_url = aws_ecr_repository.nextjs14-ecr-repo.repository_url
}

resource "null_resource" "image" {
  triggers = {
    hash = md5(join("-", [for x in fileset("", "./{*.py,*.tsx,Dockerfile}") : filemd5(x)]))
  }

  provisioner "local-exec" {
    command = <<EOF
      aws ecr get-login-password | docker login --username AWS --password-stdin ${local.repo_url}
      docker build --platform linux/amd64 -t ${local.repo_url}:latest .
      docker push ${local.repo_url}:latest
    EOF
  }
}

data "aws_ecr_image" "latest" {
  repository_name = aws_ecr_repository.nextjs14-ecr-repo.name
  image_tag       = "latest"
  depends_on      = [null_resource.image]
}


# Creating an ECS cluster
resource "aws_ecs_cluster" "nextjs14-cluster" {
  name = "nextjs14-cluster" # Naming the cluster
}

# creating an iam policy document for ecsTaskExecutionRole
data "aws_iam_policy_document" "assume_role_policy" {
  statement {
    actions = ["sts:AssumeRole"]

    principals {
      type        = "Service"
      identifiers = ["ecs-tasks.amazonaws.com"]
    }
  }
}

# creating an iam role with needed permissions to execute tasks
resource "aws_iam_role" "ecsTaskExecutionRole" {
  name               = "ecsTaskExecutionRole"
  assume_role_policy = data.aws_iam_policy_document.assume_role_policy.json
}

# attaching AmazonECSTaskExecutionRolePolicy to ecsTaskExecutionRole
resource "aws_iam_role_policy_attachment" "ecsTaskExecutionRole_policy" {
  role       = aws_iam_role.ecsTaskExecutionRole.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
}

# Creating the task definition
resource "aws_ecs_task_definition" "nextjs14-task-test" {
  family                   = "nextjs14-task-test" # Naming our first task
  container_definitions    = <<DEFINITION
  [
    {
      "name": "nextjs14-container",
      "image": "${aws_ecr_repository.nextjs14-ecr-repo.repository_url}",
      "essential": true,
      "portMappings": [
        {
          "containerPort": 3000,
          "hostPort": 3000
        }
      ],
      "memory": 512,
      "cpu": 256,
      "environment": [
        {
          "name": "DATABASE_URL",
          "value": "postgresql://${aws_db_instance.nextjs14_db.username}:${aws_db_instance.nextjs14_db.password}@${aws_db_instance.nextjs14_db.endpoint}:${aws_db_instance.nextjs14_db.port}/${aws_db_instance.nextjs14_db.db_name}"
        }
      ]
    }
  ]
  DEFINITION
  requires_compatibilities = ["FARGATE"] # Stating that we are using ECS Fargate
  network_mode             = "awsvpc"    # Using awsvpc as our network mode as this is required for Fargate
  memory                   = 512         # Specifying the memory our task requires
  cpu                      = 256         # Specifying the CPU our task requires
  execution_role_arn       = aws_iam_role.ecsTaskExecutionRole.arn # Stating Amazon Resource Name (ARN) of the execution role
}

# Providing a reference to our default VPC
resource "aws_default_vpc" "default_vpc" {
}

# Providing a reference to our default subnets
resource "aws_default_subnet" "default_subnet_a" {
  availability_zone = "us-east-1a"
}

resource "aws_default_subnet" "default_subnet_b" {
  availability_zone = "us-east-1b"
}

resource "aws_default_subnet" "default_subnet_c" {
  availability_zone = "us-east-1c"
}

# Creating a load balancer
resource "aws_alb" "nextjs14-lb" {
  name               = "nextjs14-lb" # Naming our load balancer
  load_balancer_type = "application"
  subnets = [ # Referencing the default subnets
    "${aws_default_subnet.default_subnet_a.id}",
    "${aws_default_subnet.default_subnet_b.id}",
    "${aws_default_subnet.default_subnet_c.id}"
  ]
  # Referencing the security group
  security_groups = ["${aws_security_group.nextjs14-lb_security_group.id}"]
}

# Creating a security group for the load balancer:
resource "aws_security_group" "nextjs14-lb_security_group" {
  ingress {
    from_port   = 80 
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"] 
  }

  egress {
    from_port   = 0             
    to_port     = 0             
    protocol    = "-1"          
    cidr_blocks = ["0.0.0.0/0"] 
  }
}

# Creating a target group for the load balancer
resource "aws_lb_target_group" "nextjs14-target_group" {
  name        = "target-group"
  port        = 80
  protocol    = "HTTP"
  target_type = "ip"
  vpc_id      = aws_default_vpc.default_vpc.id # Referencing the default VPC
  health_check {
    matcher = "200,301,302"
    path    = "/"
  }
}

# Creating a listener for the load balancer
resource "aws_lb_listener" "nextjs14-listener" {
  load_balancer_arn = aws_alb.nextjs14-lb.arn # Referencing our load balancer
  port              = "80"
  protocol          = "HTTP"
  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.nextjs14-target_group.arn # Referencing our target group
  }
}

# Creating the service
resource "aws_ecs_service" "nextjs14-service" {
  name            = "nextjs14-service"                        
  cluster         = aws_ecs_cluster.nextjs14-cluster.id       # Referencing our created Cluster
  task_definition = aws_ecs_task_definition.nextjs14-task-test.arn # Referencing the task our service will spin up
  launch_type     = "FARGATE"
  desired_count   = 1 # Setting the number of containers we want deployed to 3

  load_balancer {
    target_group_arn = aws_lb_target_group.nextjs14-target_group.arn # Referencing our target group
    container_name   = "nextjs14-container"
    container_port   = 3000 # Specifying the container port
  }

  network_configuration {
    subnets          = ["${aws_default_subnet.default_subnet_a.id}", "${aws_default_subnet.default_subnet_b.id}", "${aws_default_subnet.default_subnet_c.id}"]
    assign_public_ip = true                                                # Providing our containers with public IPs
    security_groups  = ["${aws_security_group.nextjs14-service_security_group.id}"] # Setting the security group
  }
}

# Creating a security group for the service
resource "aws_security_group" "nextjs14-service_security_group" {
  ingress {
    from_port = 0
    to_port   = 0
    protocol  = "-1"
    # Only allowing traffic in from the load balancer security group
    security_groups = ["${aws_security_group.nextjs14-lb_security_group.id}"]
  }

  egress {
    from_port   = 0             # Allowing any incoming port
    to_port     = 0             # Allowing any outgoing port
    protocol    = "-1"          # Allowing any outgoing protocol 
    cidr_blocks = ["0.0.0.0/0"] # Allowing traffic out to all IP addresses
  }
}

# DB instance creation

# Creating a subnet group for the RDS instance
resource "aws_db_subnet_group" "default" {
  name       = "default-subnet-group"
  subnet_ids = [
    aws_default_subnet.default_subnet_a.id,
    aws_default_subnet.default_subnet_b.id,
    aws_default_subnet.default_subnet_c.id
  ]

  tags = {
    Name = "Default subnet group"
  }
}

# Create a DB parameter group
resource "aws_db_parameter_group" "nextjs14_db_pg" {
  family = "postgres16"  # Make sure this matches your PostgreSQL version
  name   = "nextjs14-db-pg"

  parameter {
    name  = "rds.force_ssl"
    value = "0"
  }

  # This parameter allows connections from any IP
  parameter {
    name  = "log_connections"
    value = "1"
  }
}

# Modify the RDS instance to use the parameter group
resource "aws_db_instance" "nextjs14_db" {
  identifier              = "nextjs14-db"
  engine                  = "postgres"                # Setting the engine to PostgreSQL
  instance_class          = "db.t3.micro"            # Most cost-effective instance type
  allocated_storage       = 20                        # Minimum storage allowed for RDS
  db_name                 = "nextjs14db"              # Database name
  username                = "nextjsProjdbAdmin"    # Master username
  password                = "yourpassword"            # Ensure to use a secure value or reference from Secrets Manager
  vpc_security_group_ids  = [aws_security_group.rds_sg.id] # Security group allowing access from ECS and external connections
  db_subnet_group_name    = aws_db_subnet_group.default.name # Subnet group within the same VPC
  publicly_accessible     = true                      # Making it publicly accessible
  skip_final_snapshot     = true                      # Skips final snapshot on deletion

  # Additional configurations to reduce costs
  storage_type            = "gp2"                     # Default SSD storage type
  backup_retention_period = 0                         # Disables automated backups to reduce costs
  multi_az                = false                     # Single AZ deployment for cost reduction

  parameter_group_name = aws_db_parameter_group.nextjs14_db_pg.name

  tags = {
    Name = "nextjs14-db"
  }
}

# Modify the RDS security group to allow access from your IP
resource "aws_security_group" "rds_sg" {

  ingress {
    from_port   = 5432  # PostgreSQL default port
    to_port     = 5432
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]  # Allows access from any IP address
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

# Outputs
output "lb_dns" {
  value       = aws_alb.nextjs14-lb.dns_name
  description = "AWS load balancer DNS Name"
}

output "db_connection_url" {
  sensitive = true
  value       = "postgresql://${aws_db_instance.nextjs14_db.username}:${aws_db_instance.nextjs14_db.password}@${aws_db_instance.nextjs14_db.endpoint}:${aws_db_instance.nextjs14_db.port}/${aws_db_instance.nextjs14_db.db_name}"
  description = "Database connection URL for the Next.js server"
}

# Add an output for the RDS endpoint
output "rds_endpoint" {
  value       = aws_db_instance.nextjs14_db.endpoint
  description = "RDS instance endpoint"
}