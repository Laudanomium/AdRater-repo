angular.module('constellation.controllers', [])
    .controller('controlcenter', ['$scope', '$interpolate', 'constellationConsumer', 'constellationController', 'constellationManagement', 'toaster', 'keyboardManager', 'Upload', '$http',
        function ($scope, $interpolate, consumer, constellation, managementApi, toaster, keyboardManager, Upload, $http) {

            $scope.selectedPackage = null;
            $scope.selectedSentinel = null;
            $scope.selectedStateObject = null;
            $scope.selectedMessageCallback = null;
            $scope.selectedMessage = null;
            $scope.sagas = {};
            $scope.logs = [];
            $scope.packages = {};
            $scope.sentinels = {};
            $scope.objectsState = {};
            $scope.sentinelsByPackage = {};
            $scope.packagesDescriptors = {};
            $scope.messagesCallbacks = {};
            $scope.messageFiltered = 0;
            $scope.Math = window.Math;
            $scope.constellation = constellation;
            $scope.consumer = consumer;
            $scope.managementApi = undefined;

            $scope.toaster = toaster;
            $scope.cmTheme = getCookie("cmTheme") || 'twilight';
            $scope.connectionState = 'Disconnected';

            $scope.languages = [
                { Type: 'text/x-csharp', Code: "csharp", Name: ".NET / C#" },
                { Type: 'text/x-python', Code: "python", Name: "Python" },
                { Type: 'text', Code: "http", Name: "HTTP Call" },
                { Type: 'text/x-c++src', Code: "arduino", Name: "Arduino" },
                { Type: 'text/x-csharp', Code: "netmf", Name: ".NET MF / C#" },
                { Type: 'text/javascript', Code: "js", Name: "Javascript" },
                { Type: 'text/javascript', Code: "ng", Name: "Javascript / Angular Module" }];
            $scope.selectedLanguage = $scope.languages[0];

            var urlAccessKey = getParameterByName("accessKey");
            if (urlAccessKey) {
                loginWithAccessKey(getParameterByName("username") || "Administrator", urlAccessKey, 30);
                return;
            }

            $scope.username = constellationAccessKey ? "Administrator" : getUsername();
            $scope.constellationServerUri = constellationUri || getParentUri();
            var accessKey = constellationAccessKey || getAccessKey();

            consumer.intializeClient($scope.constellationServerUri, accessKey, "ControlCenter:" + $scope.username);
            constellation.intializeClient($scope.constellationServerUri, accessKey, "ControlCenter:" + $scope.username);
            managementApi.intializeClient($scope.constellationServerUri, accessKey, "ControlCenter:" + $scope.username);

            $scope.checkManagementAPI = function () {
                if ($scope.managementApi == null) {
                    toaster.pop('error', 'Management API unavailable', 'Access denied');
                }
            }

            var initManagementFeatures = function () {
                // Management API check access
                managementApi.checkAccess()
                    .success(function (result) {
                        $scope.managementApi = managementApi;
                        $scope.$apply();
                    })
                    .error(function (error) {
                        $scope.managementApi = null;
                        console.log("Management API unavailable", error);
                        $scope.$apply();
                    });
                // Get the current license
                managementApi.getLicense()
                    .success(function (result) {
                        $scope.license = result;
                        $scope.$apply();
                    })
                    .error(function (error) {
                        $scope.license = null;
                        $scope.$apply();
                    });
            };
            initManagementFeatures();

            $scope.$watch("packages", function () {
                setTimeout(resizeTable, 1000);
            });

            $scope.$watch("showConsoleFilters", function () {
                setTimeout(resizeTerminal, 10);
            });

            $scope.$on('$stateChangeSuccess', function (event, toState, toParams, fromState, fromParams) {
                $scope.onPageChanged();
            });

            $scope.onPageChanged = function () {
                if ($scope.$state.current.url.indexOf('/management/') == 0 && $scope.managementApi == null) {
                    setTimeout(function () {
                        if ($scope.managementApi == null) {
                            $scope.$state.go('Packages');
                        }
                    }, 1000);
                    return;
                }
                if ($scope.connectionState == 'Connected') {
                    setTimeout(resizeTable, 100);
                    if ($scope.$state.is('State Objects Explorer')) {
                        for (var prop in $scope.objectsState) {
                            return;
                        }
                        $scope.refreshStateObjectsList();
                    }
                    else if ($scope.$state.is('Console log')) {
                        $scope.logs = [];
                    }
                    else if ($scope.$state.is('Packages Repository')) {
                        $scope.getPackagesRepository();
                    }
                    else if ($scope.$state.is('Configuration Editor')) {
                        $scope.getServerConfiguration();
                        setTimeout(resizeTerminal, 10);
                    }
                }
            };
            $scope.onPageChanged();

            $scope.refreshStateObjectsList = function () {
                $scope.objectsState = {};
                //toaster.pop('info', 'Request StateObject', 'Please wait, we retrieve all StateObjects of your Constellation');
                //consumer.requestStateObjects('*', '*', '*', '*');
                // To dump all StateObject, use the Consumer Web API!
                $http.get($scope.constellationServerUri + '/rest/consumer/RequestStateObjects',
                     { headers: { 'SentinelName': 'Consumer', 'PackageName': 'ControlCenter:' + $scope.username, 'AccessKey': accessKey } })
                     .then(function successCallback(response) {
                        for (var idx in response.data) {
                            var stateObject = response.data[idx];
                            $scope.objectsState[stateObject.SentinelName + "/" + stateObject.PackageName + "/" + stateObject.Name] = stateObject;
                        }
                        setTimeout(function () {
                            $scope.$apply();
                            resizeTable();
                        }, 100);
                     });
            };
            keyboardManager.bind('ctrl+r', function () {
                if ($scope.$state.is('State Objects Explorer')) {
                    $scope.refreshStateObjectsList();
                }
            });

            $scope.reloadConfiguration = function (applyConfiguration) {
                constellation.reloadServerConfiguration(applyConfiguration);
                toaster.pop('info', 'Reloading configuration', 'The server reload the configuration. See the console log !');
                if (applyConfiguration) {
                    setTimeout(constellation.requestSentinelUpdates, 1000);
                }
            };

            $scope.purgeStateObjects = function (stateObjectsToRemove) {
                if (stateObjectsToRemove == undefined) {
                    for (var key in $scope.objectsState) {
                        if ($scope.objectsState[key].IsExpired) {
                            constellation.purgeStateObjects($scope.objectsState[key].SentinelName, $scope.objectsState[key].PackageName, $scope.objectsState[key].Name, '*');
                        }
                    }
                }
                else {
                    constellation.purgeStateObjects(stateObjectsToRemove.SentinelName, stateObjectsToRemove.PackageName, '*', '*');
                }
                toaster.pop('info', 'Removing State Objects', 'Request sent. Check log and reload State Objects.');
            }

            constellation.onConnectionStateChanged(function (change) {
                if (change.newState === $.signalR.connectionState.reconnecting) {
                    $scope.connectionState = 'Reconnecting';
                    toaster.pop('info', 'Reconnecting', 'Connection lost, trying to reconnect...');
                    terminal.echo("[[;#01DFD7;]Reconnecting to the Constellation ...]");
                }
                else if (change.newState === $.signalR.connectionState.connecting) {
                    $scope.connectionState = 'Connecting';
                    terminal.echo("Connecting ...");
                }
                else if (change.newState === $.signalR.connectionState.connected) {
                    initManagementFeatures();
                    $scope.connectionState = 'Connected';
                    toaster.pop('success', 'Connected', 'Connected to the Constellation ' + $scope.constellationServerUri);
                    terminal.echo("[[;#01DFD7;]Connected to the constellation]");
                    constellation.requestSentinelUpdates();
                    $scope.onPageChanged();
                }
                else if (change.newState === $.signalR.connectionState.disconnected) {
                    if (change.oldState === $.signalR.connectionState.reconnecting) {
                        terminal.error("You are disconnected !");
                        toaster.pop('error', 'Disconnected', 'Connection lost, you are disconnected from the Constellation');
                    }
                    else {
                        terminal.error("Unable to connect to your Constellation !");
                        toaster.pop('error', 'Disconnected', 'Unable to connect to your Constellation. Check the URI and credentials !');
                    }
                    $scope.connectionState = 'Disconnected';
                    // Reset scope variables
                    $scope.packages = {};
                    $scope.sentinels = {};
                    $scope.objectsState = {};
                    $scope.sentinelsByPackage = {};
                    $scope.packagesDescriptors = {};
                    $scope.messagesCallbacks = {};
                    $scope.messageFiltered = 0;
                }
                try {
                    $scope.$apply();
                }
                catch (err) { }
            });

            consumer.onUpdateStateObject(function (stateObject) {
                $scope.$apply(function () {
                    $scope.objectsState[stateObject.SentinelName + "/" + stateObject.PackageName + "/" + stateObject.Name] = stateObject;
                });
                requestResizeTable(100);
            });

            constellation.onReceiveLogMessage(function (message) {
                // Request PackageDescriptor for debugging package
                if (message.SentinelName == "Developer" && message.Message.indexOf("Declaring PackageDescriptor") == 0) {
                    constellation.requestPackageDescriptor(message.PackageName);
                }
                // Filter log
                if (($scope.consoleTypeFilter && $scope.consoleTypeFilter != "" && $scope.consoleTypeFilter != message.Level) ||
                    ($scope.consoleSentinelFilter && $scope.consoleSentinelFilter.toLowerCase() != message.SentinelName.toLowerCase()) ||
                    ($scope.consolePackageFilter && $scope.consolePackageFilter.toLowerCase() != message.PackageName.toLowerCase())) {
                    $scope.messageFiltered++;
                    return;
                }
                // Add message to the console
                $scope.$apply(function () {
                    formattedMessage = "[" + message.SentinelName + "/" + message.PackageName + "] " + new Date(message.Date).toLocaleTimeString() + " : " + message.Message;
                    encodedMessage = String(formattedMessage)
                                                            .replace(/&/g, '&amp;')
                                                            .replace(/"/g, '&quot;')
                                                            .replace(/'/g, '&#39;')
                                                            .replace(/</g, '&lt;')
                                                            .replace(/>/g, '&gt;')
                                                            .replace(/]/g, '&#93;');

                    if (message.Level == "Info") {
                        terminal.echo(encodedMessage);
                    }
                    else if (message.Level == "Debug") {
                        terminal.echo("[[;#C8C8C8 ;]" + encodedMessage + "]");
                    }
                    else if (message.Level == "Warn") {
                        terminal.echo("[[;#FFBF00;]" + encodedMessage + "]");
                    }
                    else if (message.Level == "Error" || message.Level == "Fatal") {
                        terminal.error(encodedMessage);
                    }
                    if (!$scope.$state.is('Console log') && (message.Level == "Warn" || message.Level == "Error" || message.Level == "Fatal")) {
                        $scope.logs.push(message);
                    }
                });
            });

            constellation.onUpdateSentinel(function (sentinel) {
                $scope.$apply(function () {
                    $scope.sentinels[sentinel.Description.SentinelName] = sentinel;
                });
                constellation.requestPackagesList(sentinel.Description.SentinelName);
            });

            constellation.onUpdatePackageList(function (message) {
                for (var idx in message.List) {
                    if ($scope.packages[message.SentinelName + "/" + message.List[idx].Package.Name] === undefined) {
                        $scope.packages[message.SentinelName + "/" + message.List[idx].Package.Name] = message.List[idx];
                        // For messages callbacks explorer :
                        if ($scope.sentinelsByPackage[message.List[idx].Package.Name] === undefined) {
                            $scope.sentinelsByPackage[message.List[idx].Package.Name] = [];
                        }
                        $scope.sentinelsByPackage[message.List[idx].Package.Name].push(message.SentinelName);
                        constellation.requestPackageDescriptor(message.List[idx].Package.Name);
                    }
                }
                $scope.$apply();
            });

            constellation.onUpdatePackageDescriptor(function (message) {
                $scope.$apply(function () {
                    $scope.packagesDescriptors[message.PackageName] = message.Descriptor;
                    if (message.Descriptor != null && message.Descriptor.MessageCallbacks != null) {
                        for (var idx in message.Descriptor.MessageCallbacks) {
                            $scope.messagesCallbacks[message.PackageName + "/" + message.Descriptor.MessageCallbacks[idx].MessageKey] = { PackageName: message.PackageName, MessageCallback: message.Descriptor.MessageCallbacks[idx] };
                        }
                    }
                });
            });

            constellation.onReportPackageState(function (message) {
                if ($scope.packages[message.SentinelName + "/" + message.PackageName] === undefined) {
                    constellation.requestPackagesList(message.SentinelName);
                }
                else {
                    $scope.$apply(function () {
                        $scope.packages[message.SentinelName + "/" + message.PackageName].State = message.State;
                        $scope.packages[message.SentinelName + "/" + message.PackageName].IsConnected = message.IsConnected;
                        $scope.packages[message.SentinelName + "/" + message.PackageName].ConnectionId = message.ConnectionId;
                        $scope.packages[message.SentinelName + "/" + message.PackageName].LastUpdate = message.LastUpdate;
                        $scope.packages[message.SentinelName + "/" + message.PackageName].PackageVersion = message.PackageVersion;
                        $scope.packages[message.SentinelName + "/" + message.PackageName].ConstellationClientVersion = message.ConstellationClientVersion;
                    });
                    if (message.State == "Started" && message.IsConnected == true) {
                        setTimeout(function () { constellation.requestPackageDescriptor(message.PackageName); }, 1000);
                    }
                }
            });

            constellation.onReportPackageUsage(function (message) {
                if ($scope.packages[message.SentinelName + "/" + message.PackageName] !== undefined) {
                    $scope.$apply(function () {
                        $scope.packages[message.SentinelName + "/" + message.PackageName].CPU = message.CPU;
                        $scope.packages[message.SentinelName + "/" + message.PackageName].RAM = message.RAM;
                    });
                }
            });

            $scope.connect = function () {
                consumer.connect();
                constellation.connect();
            };

            $scope.getTypeDescriptor = function (typeName, descriptor) {
                if (descriptor != null) {
                    if (descriptor.MessageCallbackTypes != null) {
                        for (var t in descriptor.MessageCallbackTypes) {
                            if (descriptor.MessageCallbackTypes[t].TypeFullname == typeName) {
                                return descriptor.MessageCallbackTypes[t];
                            }
                        }
                    }
                    if (descriptor.StateObjectTypes != null) {
                        for (var t in descriptor.StateObjectTypes) {
                            if (descriptor.StateObjectTypes[t].TypeFullname == typeName) {
                                return descriptor.StateObjectTypes[t];
                            }
                        }
                    }
                }
                return null;
            };

            $scope.generateSubParameterCode = function (typeDescriptor) {
                var parameters = [];
                for (var idx in typeDescriptor.Properties) {
                    parameters.push(codeTemplates[$scope.selectedLanguage.Code].formatProperties(typeDescriptor.Properties[idx]));
                }
                return parameters.join(", ");
            };

            $scope.generateArgumentsStack = function (descriptor) {
                var parameters = [];
                for (var idx in descriptor.MessageCallback.Parameters) {
                    var arg = descriptor.MessageCallback.Parameters[idx];
                    var typeDescriptor = $scope.getTypeDescriptor(arg.TypeName, $scope.packagesDescriptors[descriptor.PackageName]);
                    if (typeDescriptor != null) {
                        if (typeDescriptor.IsEnum == true) {
                            parameters.push(arg.TypeName);
                        }
                        else if (typeDescriptor.IsArray == true) {
                            parameters.push(typeDescriptor.GenericParameters[0] + '[]');
                        }
                        else if (typeDescriptor.IsGeneric == true) {
                            parameters.push(typeDescriptor.TypeName + '<' + typeDescriptor.GenericParameters.join(", ") + '>');
                        }
                        else {
                            parameters.push(codeTemplates[$scope.selectedLanguage.Code].formatArgumentsList($scope.generateSubParameterCode(typeDescriptor), arguments));
                        }
                    }
                    else {
                        parameters.push(codeTemplates[$scope.selectedLanguage.Code].formatParameters(arg, arguments));
                    }
                }
                return codeTemplates[$scope.selectedLanguage.Code].formatArguments(parameters, arguments);
            };

            $scope.generateCode = function () {
                var codeSamples = [];
                var samples = ($scope.selectedMessageCallback.MessageCallback.ResponseType != null && codeTemplates[$scope.selectedLanguage.Code].samplesWithSaga != null) ?
                    codeTemplates[$scope.selectedLanguage.Code].samplesWithSaga : codeTemplates[$scope.selectedLanguage.Code].samples;
                for (var idx in samples) {
                    codeSamples.push(samples[idx]);
                }
                $scope.messageCallbackCode = $interpolate(codeSamples.join('\n\n'))($scope);
            };

            $scope.sendMessage = function (sentinel, messageCallback) {
                var packageName = messageCallback.PackageName;
                var messageKey = messageCallback.MessageCallback.MessageKey;
                var datas = [];
                $("form#" + packageName + messageKey + " input, form#" + packageName + messageKey + " select, form#" + packageName + messageKey + " textarea").each(function () {
                    var parentIndex = $(this).data('parentindex');
                    var val = $(this).val();
                    if (jQuery.trim(val).length > 0) {
                        if (parentIndex !== undefined) {
                            if (datas[parentIndex] == null) {
                                datas[parentIndex] = {};
                            }
                            datas[parentIndex][$(this).attr('name')] = val;
                        }
                        else {
                            datas[$(this).data('parameterindex')] = val;
                        }

                    }
                });
                datas = datas.length == 1 ? datas[0] : datas;
                console.log(datas);

                var sendTo = sentinel == "All" ? packageName : (sentinel + '/' + packageName);
                if ($("#UseSaga_" + packageName + messageKey).prop("checked")) {
                    // Send Message With Saga
                    console.log("Sending message '" + messageKey + "' with Saga to '" + sendTo + "'");
                    var scope = { Scope: 'Package', Args: [sendTo] };
                    consumer.sendMessageWithSaga(scope, messageKey, datas, function (message) {
                        $scope.sagas[message.Scope.SagaId].ResponseDate = new Date();
                        $scope.sagas[message.Scope.SagaId].ResponseData = message;
                        console.log($scope.sagas[message.Scope.SagaId]);
                        if ($scope.sagas[message.Scope.SagaId].ResponseDate - $scope.sagas[message.Scope.SagaId].RequestDate >= 5000) {
                            toaster.pop('info', 'Response message received', "In response to '" + messageKey + "' sent by " + message.Sender.FriendlyName);
                        }
                    });
                    $scope.sagas[scope.SagaId] = { RequestDate: new Date(), ResponseDate: null, RequestData: datas, ResponseData: null, MessageKey: messageKey, Scope: scope };
                    toaster.pop('info', 'Sending message in a Saga', "A message '" + messageKey + "' is sent to '" + sendTo + "' in a saga #" + scope.SagaId);
                }
                else {
                    // Send Message Without Saga
                    console.log("Sending message '" + messageKey + "' to '" + sendTo + "'");
                    consumer.sendMessage({ Scope: 'Package', Args: [sendTo] }, messageKey, datas);
                    toaster.pop('info', 'Sending message', "A message '" + messageKey + "' is sent to '" + sendTo + "'");
                }
            };

            $scope.getPackagesRepository = function () {
                managementApi.getPackages()
                    .success(function (result) {
                        $scope.packagesRepository = result;
                    })
                    .error(function (error) {
                        toaster.pop('error', 'Management API Error', error.message);
                        console.log(error);
                    });
            }

            $scope.serverConfiguration = { value: "" };
            $scope.getServerConfiguration = function () {
                managementApi.getServerConfiguration()
                    .success(function (result) {
                        $scope.serverConfiguration.value = result;
                    })
                    .error(function (error) {
                        toaster.pop('error', 'Management API Error', error.message);
                        console.log(error);
                    });
            }
            $scope.setServerConfiguration = function (reloadAndDeployConfiguration) {
                managementApi.setServerConfiguration($scope.serverConfiguration.value)
                    .success(function (result) {
                        if (typeof reloadAndDeployConfiguration === 'undefined') {
                            toaster.pop('info', 'Save done', 'The configuration file was successfully saved');
                        }
                        else {
                            constellation.reloadServerConfiguration(reloadAndDeployConfiguration);
                            toaster.pop('info', 'Save done', 'The configuration file was successfully saved and reloaded');
                            if (reloadAndDeployConfiguration) {
                                setTimeout(constellation.requestSentinelUpdates, 1000);
                            }
                        }
                    })
                    .error(function (error) {
                        toaster.pop('error', error.ExceptionMessage, (error.InnerException != undefined ? error.InnerException.ExceptionMessage : error.Message));
                        console.log(error);
                    });
            }
            keyboardManager.bind('ctrl+s', function () {
                if ($scope.$state.is('Configuration Editor')) {
                    $scope.setServerConfiguration(false);
                }
            });

            var configurationEditor = null;
            $scope.codemirrorLoaded = function (_editor) {
                configurationEditor = _editor;
            };
            keyboardManager.bind('f11', function () {
                if ($scope.$state.is('Configuration Editor')) {
                    configurationEditor.setOption('fullScreen', !configurationEditor.getOption('fullScreen'));
                }
            });

            $scope.filesUpload = {};
            $scope.upload = function (files) {
                if (files && files.length) {
                    for (var i = 0; i < files.length; i++) {
                        var file = files[i];
                        if (!file.$error) {
                            $scope.filesUpload[file.name] = { progress: 0, status: '', error: false };
                            Upload.upload({
                                url: managementApi.getRequestUri("UploadPackage"),
                                data: { file: file }
                            }).then(function (resp) {
                                $scope.filesUpload[resp.config.data.file.name].status = resp.statusText;
                            }, function (resp) {
                                $scope.filesUpload[file.name].error = true;
                                $scope.filesUpload[file.name].status = resp.statusText;
                            }, function (evt) {
                                var progressPercentage = parseInt(100.0 * evt.loaded / evt.total);
                                $scope.filesUpload[evt.config.data.file.name].progress = progressPercentage;
                            });
                        }
                    }
                }
            };
            $scope.openFileUploadModal = function () {
                $scope.filesUpload = {};
            };

            $scope.selectPackage = function (p) { $scope.selectedPackage = p != null ? p.SentinelName + "/" + p.Package.Name : null; };
            $scope.selectSentinel = function (s) { $scope.selectedSentinel = s != null ? s.Description.SentinelName : null; };
            $scope.selectMessageCallback = function (mc) { $scope.selectedMessageCallback = mc; $scope.generateCode(); };
            $scope.selectLanguage = function (l) { $scope.selectedLanguage = l; $scope.generateCode(); };
            $scope.selectTypeDescriptor = function (t, p) { $scope.selectedTypeDescriptor = { TypeName: t, PackageName: p }; };
            $scope.selectStateObject = function (stateObject) {
                var key = stateObject.SentinelName + "/" + stateObject.PackageName + "/" + stateObject.Name;
                $scope.selectedStateObject =
                    {
                        Key: key,
                        IsObject: typeof $scope.objectsState[key].Value == 'object'
                    };
                consumer.requestStateObjects(stateObject.SentinelName, stateObject.PackageName, stateObject.Name, '*')
            };
            $scope.selectMessage = function (msg) {
                $scope.showMessageRequest = false;
                if (msg != null) {
                    delete $scope.sagas[msg.Scope.SagaId];
                }
                $scope.selectedMessage = msg;
            };
            $scope.setCodeMirrorTheme = function (theme) {
                setCookie("cmTheme", theme, 8 * 24 * 60 * 60);
                $scope.cmTheme = theme;
            };

            $scope.connect();
        }]);
