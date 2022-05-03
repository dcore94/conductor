export default { config };

var config = {
  "pep-credentials" : "Z2N1YmUtcGVwOjAxOWMyYzNlLTUyNGUtNDhiZi1iODliLTllMjFmMDg1MjdlMA==",
  "hosts" : [
    {
      "host": "conductor-dev.int.d4science.net",
      "audience" : "conductor-server",
      "allow-basic-auth" : true,
      "paths" : [
        {
          "name" : "metadata",
          "path" : "^/api/metadata/(taskdefs|workflow)/?.*$",
          "methods" : [
            {
              "method" : "GET",
              "scopes" : ["get","list"]
            }
          ]
        },
        {
          "name" : "metadata.taskdefs",
          "path" : "^/api/metadata/taskdefs/?.*$",
          "methods" : [
            {
              "method" : "POST",
              "scopes" : ["create"]
            },
            {
              "method" : "DELETE",
              "scopes" : ["delete"],
            },
            {
              "method" : "PUT",
              "scopes" : ["update"],
            }
          ]
        },
        {
          "name" : "metadata.workflow",
          "path" : "^/api/metadata/workflow/?.*$",
          "methods" : [
            {
              "method" : "POST",
              "scopes" : ["create"]
            },
            {
              "method" : "DELETE",
              "scopes" : ["delete"],
            },
            {
              "method" : "PUT",
              "scopes" : ["update"],
            }
          ]
        },
        {
          "name" : "workflow",
          "path" : "^/api/workflow/?.*$",
          "methods" : [
            {
              "method" : "GET",
              "scopes" : ["get"],
            },
            {
              "method" : "POST",
              "scopes" : ["start"],
            },
            {
              "method" : "DELETE",
              "scopes" : ["terminate"],
            }
          ]
        },
	{
          "name" : "event",
          "path" : "^/api/event/?.*$",
          "methods" : [
            {
              "method" : "GET",
              "scopes" : ["get"],
            },
            {
              "method" : "POST",
              "scopes" : ["create"],
            },
            {
              "method" : "DELETE",
              "scopes" : ["delete"],
            },
	    {
              "method" : "PUT",
              "scopes" : ["update"],
            }
          ]
        },
        {
          "name" : "task",
          "path" : "^/api/tasks/poll/.+$",
          "methods" : [
            {
              "method" : "GET",
              "scopes" : ["poll"],
            }
          ]
        },
	{
          "name" : "queue",
          "path" : "^/api/tasks/queue/.+$",
          "methods" : [
            {
              "method" : "GET",
              "scopes" : ["get"],
            }
          ]
        },
        {
          "name" : "task",
          "path" : "^/api/tasks[/]?$",
          "methods" : [
            {
              "method" : "POST",
              "scopes" : ["update"],
            }
          ]
        },
	{
          "name" : "log",
          "path" : "^/api/tasks/.+/log$",
          "methods" : [
            {
              "method" : "GET",
              "scopes" : ["get"],
            }
          ]
        }
      ]
    }
  ]  
}
