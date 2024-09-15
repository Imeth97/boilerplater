# Check if the IAM user already exists. If it does, prompt the user that this will delete the existing user and the associated secrets
aws iam get-user --user-name GH-AdminUser > /dev/null 2>&1

if [ $? -eq 0 ]; then
    echo "!IMPORTANT! \nAn IAM user for GitHub Actions already exists. Are you sure you want to recreate it? This will delete the existing user and the associated secrets before creating a new user. (y/n)"
    read -n 1 -s
    echo
    if [ "$REPLY" = "y" ]; then
        # Detach the AdministratorAccess policy from the user
        aws iam detach-user-policy --user-name GH-AdminUser --policy-arn arn:aws:iam::aws:policy/AdministratorAccess

        # Delete all access keys from the user
        aws iam list-access-keys --user-name GH-AdminUser --query 'AccessKeyMetadata[*].[AccessKeyId]' --output text | xargs -t -L1 aws iam delete-access-key --user-name GH-AdminUser --access-key-id

        # Delete the existing IAM user if it exists
        aws iam delete-user --user-name GH-AdminUser
    else
        echo "Exiting script."
        exit 1
    fi
fi


# Create a new IAM user
aws iam create-user --user-name GH-AdminUser

# Attach AdministratorAccess policy to the user
aws iam attach-user-policy --user-name GH-AdminUser --policy-arn arn:aws:iam::aws:policy/AdministratorAccess

# Get the AWS account ID first
export AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query 'Account' --output text)
# Create access key for the user and extract both ID and secret
access_key_output=$(aws iam create-access-key --user-name GH-AdminUser --query 'AccessKey.[AccessKeyId,SecretAccessKey]' --output text)
access_key=$(echo "$access_key_output" | awk '{print $1}')
secret_access_key=$(echo "$access_key_output" | awk '{print $2}')
aws_region=$(aws configure get region)

# Add the AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY to the GitHub repository secrets
gh secret set AWS_ACCESS_KEY_ID --body $access_key
gh secret set AWS_SECRET_ACCESS_KEY --body $secret_access_key
gh secret set AWS_ACCOUNT_ID --body $AWS_ACCOUNT_ID

# Add the AWS_REGION to the GitHub repository secrets
gh secret set AWS_REGION --body $aws_region


# Add the ECR_REPOSITORY to the GitHub repository secrets
gh secret set ECR_REPOSITORY --body "nextjs14-ecr-repo"